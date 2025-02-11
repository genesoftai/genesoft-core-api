import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { CallChatOpenAIPayload } from "@/modules/types/llm/openai";
import { BaseMessage } from "@langchain/core/messages";
import { wrapSDK } from "langsmith/wrappers";

@Injectable()
export class LlmService {
    private readonly serviceName = LlmService.name;
    private readonly logger = new Logger(this.serviceName);

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
}
