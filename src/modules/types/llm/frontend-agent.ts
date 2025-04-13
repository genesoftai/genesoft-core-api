import { GeminiPayload } from "./gemini";

export interface CallFrontendDeveloperAgent {
    payload: GeminiPayload;
    type: string;
    imageUrl?: string;
    referenceLinkUrl?: string;
    branch: string;
    repository: string;
    projectDocumentation?: string;
    latestRepoTree?: string;
}
