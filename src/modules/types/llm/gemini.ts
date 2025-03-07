import { BaseMessageLike } from "@langchain/core/messages";

export interface CallGeminiPayload {
    payload: GeminiPayload;
    type: string;
    imageUrl?: string;
    referenceLinkUrl?: string;
}

export interface GeminiPayload {
    model: string;
    payload?: object;
    messages: BaseMessageLike[];
    nodeName: string;
}
