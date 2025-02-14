import { Module } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { FeedbackController } from "./feedback.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectModule } from "@/modules/project/project.module";
import { Feedback } from "./entity/feedback.entity";
import { GithubModule } from "@/modules/github/github.module";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { LlmModule } from "@/modules/llm/llm.module";
import { DevelopmentModule } from "@/modules/development/development.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Feedback, GithubRepository]),
        ProjectModule,
        GithubModule,
        LlmModule,
        DevelopmentModule,
    ],
    providers: [FeedbackService],
    controllers: [FeedbackController],
    exports: [FeedbackService],
})
export class FeedbackModule {}
