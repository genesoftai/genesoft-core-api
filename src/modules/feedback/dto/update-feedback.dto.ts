import { FeedbackMessage } from "@/modules/types/feedback";
import {
    IsString,
    IsBoolean,
    IsOptional,
    IsArray,
    IsNotEmpty,
} from "class-validator";

export class UpdateFeedbackDto {
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

export class AddMessageToFeedbackDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    feedback_id: string;

    @IsArray()
    @IsNotEmpty()
    messages: FeedbackMessage[];
}

export class SubmitFeedbackDto {
    @IsString()
    @IsNotEmpty()
    feedback_id: string;
}
