import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { TalkToFeedbackDto } from "./dto/talk-to-feedback.dto";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { SubmitFeedbackDto } from "./dto/update-feedback.dto";

@Controller("feedback")
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Post()
    async createFeedback(@Body() payload: CreateFeedbackDto) {
        return this.feedbackService.createFeedback(payload);
    }

    @Get(":feedback_id")
    async getFeedbackById(@Param("feedback_id") feedback_id: string) {
        return this.feedbackService.getFeedbackById(feedback_id);
    }

    @Post("talk")
    async talkToFeedback(@Body() payload: TalkToFeedbackDto) {
        return this.feedbackService.talkToFeedback(payload);
    }

    @Post("submit")
    async submitFeedback(@Body() payload: SubmitFeedbackDto) {
        return this.feedbackService.submitFeedback(payload);
    }

    @Get("/project/:project_id/ongoing")
    async getLatestOngoingFeedback(@Param("project_id") project_id: string) {
        return this.feedbackService.getLatestOngoingFeedback(project_id);
    }

    @Get("/project/:project_id/history")
    async getHistoricalFeedbacksByProjectId(
        @Param("project_id") project_id: string,
    ) {
        return this.feedbackService.getHistoricalFeedbacksByProjectId(
            project_id,
        );
    }
}
