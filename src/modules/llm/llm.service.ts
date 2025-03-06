import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { CallChatOpenAIPayload } from "@/modules/types/llm/openai";
import { BaseMessage } from "@langchain/core/messages";
import { wrapSDK } from "langsmith/wrappers";
import { CallGeminiPayload } from "../types/llm/gemini";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import Exa from "exa-js";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";
import { ExaSearchResults } from "@langchain/exa";

@Injectable()
export class LlmService {
    private readonly serviceName = LlmService.name;
    private readonly logger = new Logger(this.serviceName);
    private readonly exa: Exa;

    constructor(
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
    ) {
        this.exa = new Exa(this.thirdPartyConfigurationService.exaApiKey);
    }

    async callChatOpenAI(payload: CallChatOpenAIPayload): Promise<BaseMessage> {
        try {
            const chatOpenAI = new ChatOpenAI({
                model: payload.model,
                ...payload.payload,
            });

            const chatOpenAIWrapper = wrapSDK(chatOpenAI, {
                name: payload.nodeName,
                run_type: "llm",
            });
            const result = await chatOpenAIWrapper.invoke(payload.messages);
            return result;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName} Error calling ChatOpenAI`,
                error,
                payload,
            });
            throw error;
        }
    }

    async callGemini(payload: CallGeminiPayload): Promise<BaseMessage> {
        try {
            const gemini = new ChatGoogleGenerativeAI({
                model: payload.model,
                ...payload.payload,
            });
            const exa = new ExaSearchResults({
                client: this.exa,
                searchArgs: {
                    numResults: 3,
                    type: "auto",
                },
            });
            const geminiWithTools = gemini.bindTools([exa]);

            const geminiWrapper = wrapSDK(geminiWithTools, {
                name: payload.nodeName,
                run_type: "llm",
            });
            const result = await geminiWrapper.invoke(payload.messages);
            return result;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName} Error calling Gemini`,
                error,
                payload,
            });
            throw error;
        }
    }
}
