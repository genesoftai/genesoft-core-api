import { BaseMessageLike } from "@langchain/core/messages";

export interface OpenAIMessage {
    role: "user" | "assistant" | "system";
    content: string;
}
export interface CallChatOpenAIPayload {
    model: string;
    payload?: object;
    messages: BaseMessageLike[];
    nodeName: string;
}
