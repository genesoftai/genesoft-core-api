import { Controller, Get, Query } from "@nestjs/common";
import { LlmService } from "./llm.service";

@Controller("llm")
export class LlmController {
    constructor(private readonly llmService: LlmService) {}

    @Get("research-content-with-perplexity")
    async researchContentWithPerplexity(
        @Query("query") query: string,
        @Query("model") model: string,
    ) {
        return this.llmService.researchContentWithPerplexity(query, model);
    }
}
