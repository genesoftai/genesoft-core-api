import { GeminiPayload } from "./gemini";

export interface CallBackendDeveloperAgent {
    payload: GeminiPayload;
    type: string;
    imageUrl?: string;
    referenceLinkUrl?: string;
    branch: string;
    repository: string;
}
