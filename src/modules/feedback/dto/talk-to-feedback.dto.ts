import { FeedbackMessage } from "@/modules/types/feedback";
import { IsString, IsArray, IsNotEmpty, ValidateNested } from "class-validator";

export class TalkToFeedbackDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    messages: FeedbackMessage[];

    @IsString()
    @IsNotEmpty()
    feedback_id: string;
}
