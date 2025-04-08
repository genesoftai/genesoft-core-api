import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI } from "@langchain/openai";
import { CallChatOpenAIPayload } from "@/modules/types/llm/openai";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { wrapSDK } from "langsmith/wrappers";
import { CallGeminiPayload } from "../types/llm/gemini";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import Exa from "exa-js";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";
import { ExaSearchResults } from "@langchain/exa";
import { ConversationMessage } from "@/conversation/entity/message.entity";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { GithubService } from "../github/github.service";
import { CallBackendDeveloperAgent } from "../types/llm/backend-agent";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { catchError, lastValueFrom, map } from "rxjs";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class LlmService {
    private readonly serviceName = LlmService.name;
    private readonly logger = new Logger(this.serviceName);
    private readonly exa: Exa;

    constructor(
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
        private readonly githubService: GithubService,
        private readonly httpService: HttpService,
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

    async researchContentWithPerplexity(
        query: string,
        model: string,
    ): Promise<{ content: string; citations: string[] }> {
        /** Get the research content from the internet to help implement code (ex. API documentation, code examples, best practices, security practices, etc.). */
        const url = "https://api.perplexity.ai/chat/completions";

        const payload = {
            model,
            messages: [
                {
                    role: "user",
                    content: query,
                },
            ],
            max_tokens: 2000,
        };
        const headers = {
            Authorization: `Bearer ${this.thirdPartyConfigurationService.perplexityApiKey}`,
            "Content-Type": "application/json",
        };

        try {
            console.log({
                url,
                payload,
                headers,
            });
            const response = await lastValueFrom(
                this.httpService.post(url, payload, { headers }).pipe(
                    map((res) => res.data),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.researchContentWithPerplexity: Error getting content summary`,
                            error,
                        });
                        throw error;
                    }),
                ),
            );
            this.logger.log({
                message: `${this.serviceName}.researchContentWithPerplexity: Content summary from perplexity`,
                metadata: { response },
            });
            const content = response.choices[0].message.content;
            const citations = response.citations;
            return { content, citations };
        } catch (e) {
            this.logger.error({
                message: `${this.serviceName}.researchContentWithPerplexity: Error getting content summary`,
                error: e,
            });
            return {
                content: `Error getting content summary: ${e}`,
                citations: [],
            };
        }
    }

    async callBackendDeveloperAgent({
        payload,
        type,
        imageUrl,
        referenceLinkUrl,
        branch,
        repository,
    }: CallBackendDeveloperAgent) {
        try {
            const threadId = uuidv4();
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

            const readGithubFile = tool(
                async ({ path }: { path: string }): Promise<string> => {
                    /**
                     * Read a file from the github repository.
                     */
                    const { content } =
                        await this.githubService.getRepositoryContent({
                            repository,
                            path,
                            ref: branch,
                        });
                    return content;
                },
                {
                    name: "readGithubFile",
                    description: "Read a file from the github repository",
                    schema: z.object({
                        path: z.string().describe("The path of the file"),
                    }),
                },
            );
            const citations = [];

            const researchContentWithPerplexity = tool(
                async ({
                    query,
                }: {
                    query: string;
                }): Promise<{ content: string; citations: string[] }> => {
                    const { content, citations: citationsFromPerplexity } =
                        await this.researchContentWithPerplexity(
                            query,
                            "sonar-pro",
                        );
                    citations.push(...citationsFromPerplexity);
                    return { content, citations };
                },
                {
                    name: "researchContentWithPerplexity",
                    description:
                        "Research content with perplexity to help discuss and answer user's messages (ex. API documentation, code examples, best practices, security practices, etc.).",
                    schema: z.object({
                        query: z
                            .string()
                            .describe(
                                "The query to research content with perplexity",
                            ),
                    }),
                },
            );

            const tools = [exa, readGithubFile, researchContentWithPerplexity];
            const agentCheckpointer = new MemorySaver();

            const agent = await createReactAgent({
                llm: gemini,
                tools: tools,
                checkpointer: agentCheckpointer,
            });

            if (type === "text") {
                const finalState = await agent.invoke(
                    {
                        messages: [
                            ...payload.messages,
                            new HumanMessage(
                                "You are a helpful backend developer that can answer questions and help with tasks for software engineer who want to build a backend service using NestJS. You can call researchContentWithPerplexity to research content from the internet to help discuss and answer user's messages (ex. API documentation, How to do something, code examples, best practices, security practices, etc.). You can also read files from the github repository using readGithubFile tool.",
                            ),
                        ],
                    },
                    {
                        configurable: { thread_id: threadId },
                        runName: "backend-developer-agent",
                        recursionLimit: 10,
                    },
                );
                return finalState.messages[finalState.messages.length - 1]
                    .content;
            } else {
                const transformedMessage = await this.transformMessageWithImage(
                    payload.messages as BaseMessage[],
                    imageUrl,
                );
                const finalState = await agent.invoke(
                    {
                        messages: [transformedMessage],
                    },
                    {
                        configurable: { thread_id: threadId },
                        runName: "backend-developer-agent",
                        recursionLimit: 10,
                    },
                );
                return finalState.messages[finalState.messages.length - 1]
                    .content;
            }
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName} Error calling Gemini`,
                error,
                payload,
            });
            throw error;
        }
    }

    async callGemini({
        payload,
        type,
        imageUrl,
        referenceLinkUrl,
    }: CallGeminiPayload): Promise<any> {
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

            if (type === "text") {
                const result = await geminiWrapper.invoke(payload.messages);
                return result;
            } else {
                const transformedMessage = await this.transformMessageWithImage(
                    payload.messages as BaseMessage[],
                    imageUrl,
                );
                const result = await geminiWrapper.invoke([transformedMessage]);
                return result;
            }
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName} Error calling Gemini`,
                error,
                payload,
            });
            throw error;
        }
    }

    async transformMessageWithImage(
        messages: BaseMessage[],
        imageUrl?: string,
    ) {
        if (imageUrl) {
            const imageData = await fetch(imageUrl).then((res) =>
                res.arrayBuffer(),
            );
            const originalMessages = messages.map((message) => ({
                type: "text",
                text: message.content,
            }));
            const base64Image = Buffer.from(imageData).toString("base64");
            return new HumanMessage({
                content: [
                    ...originalMessages,
                    {
                        type: "text",
                        text: `Here is the image url: ${imageUrl}`,
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`,
                        },
                    },
                ],
            });
        }
    }

    async generateConversationName(
        messages: ConversationMessage[],
    ): Promise<string> {
        const ConversationNameFormatter = z.object({
            name: z.string().describe("The name of the conversation"),
        });
        try {
            const formattedMessages = messages.map((message) => {
                return `[${message.sender_type.toUpperCase()}] ${message.content}`;
            });
            const messagesContext = `
            These are historical messages between users and you as a project manager:
            ${formattedMessages.join("\n")}

            Please generate a name for the conversation based on the messages.
            Make it short and concise in 1 sentence.
            `;
            const chatOpenAI = new ChatOpenAI({
                model: "gpt-4o-mini",
            }).withStructuredOutput(ConversationNameFormatter);

            const chatOpenAIWrapper = wrapSDK(chatOpenAI, {
                name: "generateConversationName",
                run_type: "llm",
            });
            const result = await chatOpenAIWrapper.invoke([
                new HumanMessage({
                    content: messagesContext,
                }),
            ]);
            return result.name;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName} Error getting conversation name`,
                error,
            });
            throw error;
        }
    }

    async generateProjectName(
        description: string,
        backend_requirements: string,
    ): Promise<string> {
        const ProjectNameFormatter = z.object({
            name: z.string().describe("The name of the project"),
        });
        try {
            const input = `
            This is the description of the project from user:
            ${description}

            This is the backend requirements of the project from user:
            ${backend_requirements}

            Please generate a name for the project based on the description or backend requirements.
            Make it short and concise in 1 sentence.
            `;
            const chatOpenAI = new ChatOpenAI({
                model: "gpt-4o-mini",
            }).withStructuredOutput(ProjectNameFormatter);

            const chatOpenAIWrapper = wrapSDK(chatOpenAI, {
                name: "generateProjectName",
                run_type: "llm",
            });
            const result = await chatOpenAIWrapper.invoke([
                new HumanMessage({
                    content: input,
                }),
            ]);
            return result.name;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName} Error getting project name`,
                error,
            });
            throw error;
        }
    }
}
