import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class SubmitConversationDto {
    @IsNotEmpty()
    @IsString()
    conversation_id: string;

    @IsString()
    @IsOptional()
    github_branch_id?: string;
}

export class SubmitConversationForGithubRepository {
    @IsNotEmpty()
    @IsString()
    conversation_id: string;

    @IsString()
    @IsNotEmpty()
    github_branch_id: string;
}
