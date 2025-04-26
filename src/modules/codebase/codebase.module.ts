import { Module } from "@nestjs/common";
import { CodebaseController } from "./codebase.controller";
import { CodebaseService } from "./codebase.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Codebase } from "./entity/codebase.entity";
import { GithubModule } from "../github/github.module";
import { Project } from "../project/entity/project.entity";
import { GithubRepository } from "../github/entity/github-repository.entity";
import { CodesandboxModule } from "../codesandbox/codesandbox.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Codebase, GithubRepository, Project]),
        GithubModule,
        CodesandboxModule,
    ],
    controllers: [CodebaseController],
    providers: [CodebaseService],
    exports: [CodebaseService],
})
export class CodebaseModule {}
