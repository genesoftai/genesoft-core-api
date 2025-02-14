import { FeedbackMessage } from "@/modules/types/feedback";
import { IsString, IsBoolean, IsOptional, IsArray } from "class-validator";

export class CreateFeedbackDto {
    @IsString()
    project_id: string;

    @IsBoolean()
    @IsOptional()
    is_submit?: boolean;

    @IsArray()
    @IsOptional()
    messages?: FeedbackMessage[];

    @IsString()
    @IsOptional()
    status?: string;
}
