import { BaseMessageLike } from "@langchain/core/messages";

export interface CallGeminiPayload {
    model: string;
    payload?: object;
    messages: BaseMessageLike[];
    nodeName: string;
}
