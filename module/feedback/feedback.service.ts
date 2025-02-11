import { Feedback } from "module/feedback/entity/feedback.entity";
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import {
    UpdateFeedbackDto,
    AddMessageToFeedbackDto,
    SubmitFeedbackDto,
} from "./dto/update-feedback.dto";
import { TalkToFeedbackDto } from "./dto/talk-to-feedback.dto";
import { GithubService } from "@/modules/github/github.service";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { ProjectType } from "@/modules/constants/project";
import { ProjectService } from "@/modules/project/project.service";
import { formatGithubRepositoryTree } from "@/utils/project/documentation";
import { LlmService } from "module/llm/llm.service";
import { BaseMessageLike } from "@langchain/core/messages";
import { FeedbackMessage } from "@/modules/types/feedback";
import { DevelopmentService } from "@/modules/development/development.service";
import { IterationType } from "@/modules/constants/development";

@Injectable()
export class FeedbackService {
    private readonly serviceName = FeedbackService.name;
    private readonly logger = new Logger(FeedbackService.name);
    constructor(
        @InjectRepository(Feedback)
        private readonly feedbackRepository: Repository<Feedback>,
        private readonly githubService: GithubService,
        @InjectRepository(GithubRepository)
        private readonly githubRepositoryRepository: Repository<GithubRepository>,
        private readonly projectService: ProjectService,
        private readonly llmService: LlmService,
        private readonly developmentService: DevelopmentService,
    ) {}

    async createFeedback(
        createFeedbackDto: CreateFeedbackDto,
    ): Promise<Feedback> {
        const feedback = this.feedbackRepository.create(createFeedbackDto);
        return await this.feedbackRepository.save(feedback);
    }

    async findAll(): Promise<Feedback[]> {
        return await this.feedbackRepository.find();
    }

    async getFeedbackById(id: string): Promise<Feedback> {
        return await this.feedbackRepository.findOne({ where: { id } });
    }

    async findByProjectId(project_id: string): Promise<Feedback> {
        return await this.feedbackRepository.findOne({ where: { project_id } });
    }

    async update(
        id: string,
        updateFeedbackDto: UpdateFeedbackDto,
    ): Promise<Feedback> {
        await this.feedbackRepository.update(id, updateFeedbackDto);
        return await this.getFeedbackById(id);
    }

    async addMessage(
        addMessageDto: AddMessageToFeedbackDto,
    ): Promise<Feedback> {
        const feedback = await this.getFeedbackById(addMessageDto.feedback_id);

        if (!feedback) {
            throw new NotFoundException("Feedback not found");
        }

        if (!feedback.messages) {
            feedback.messages = [];
        }

        feedback.messages = [...feedback.messages, ...addMessageDto.messages];
        return await this.feedbackRepository.save(feedback);
    }

    async remove(id: string): Promise<void> {
        await this.feedbackRepository.delete(id);
    }

    async talkToFeedback(payload: TalkToFeedbackDto) {
        let feedback = await this.getFeedbackById(payload.feedback_id);
        if (!feedback) {
            throw new NotFoundException("Feedback not found");
        }

        feedback = await this.addMessage({
            feedback_id: feedback.id,
            project_id: payload.project_id,
            messages: payload.messages,
        });
        const formattedNewMessages = payload.messages.map((message) => {
            return `${message.sender}: ${message.content}`;
        });
        const formattedMessages = feedback.messages.map((message) => {
            return `${message.sender}: ${message.content}`;
        });

        const projectDocumentation =
            await this.projectService.getOverallProjectDocumentation(
                payload.project_id,
            );

        const frontendRepository =
            await this.githubRepositoryRepository.findOne({
                where: {
                    project_id: payload.project_id,
                    type: ProjectType.Web,
                },
            });

        const backendRepository = await this.githubRepositoryRepository.findOne(
            {
                where: {
                    project_id: payload.project_id,
                    type: ProjectType.Api,
                },
            },
        );

        const messagesContext = `
        These are historical messages between user and AI agent to feedback project:
        ${formattedMessages.join("\n")}
        `;

        const apiDocumentationResponse =
            await this.githubService.getRepositoryContent({
                repository: backendRepository.name,
                path: "api_doc.md",
                ref: "staging",
            });

        const apiDocumentation = `
        Backend API Documentation of this project:
        ${apiDocumentationResponse.content}
        `;

        const frontendRepoTreeResponse =
            await this.githubService.getRepositoryTrees({
                repository: frontendRepository.name,
                branch: "staging",
            });

        const frontendRepoTree = formatGithubRepositoryTree(
            frontendRepoTreeResponse,
        );

        const backendRepoTreeResponse =
            await this.githubService.getRepositoryTrees({
                repository: backendRepository.name,
                branch: "staging",
            });

        const backendRepoTree = formatGithubRepositoryTree(
            backendRepoTreeResponse,
        );

        const userInput = `
        Please answer user messages:
        ${formattedNewMessages.join("\n")}
        `;

        const systemMessage = `
        You are a Technical Project Manager with extensive experience in both business and technical aspects of web application development of customer project. Your role is to:

        1. Facilitate friendly and constructive conversations with customers about project improvements
        2. Help collect and understand essential feedback about the project
        3. Provide clear explanations about both frontend and backend technical details when needed
        4. Bridge the gap between business requirements and technical implementation
        5. Offer informative responses about project features, architecture, and development process
        6. Guide discussions to ensure feedback is actionable and aligned with project goals
        7. Please tell to submit feedback when they complted the feedback conversation.

        Please engage in a helpful conversation while keeping both business value and technical feasibility in mind.
        `;

        const messages: BaseMessageLike[] = [
            {
                role: "system",
                content: systemMessage,
            },
            {
                role: "user",
                content: projectDocumentation,
            },
            {
                role: "user",
                content: apiDocumentation,
            },
            {
                role: "user",
                content: frontendRepoTree,
            },
            {
                role: "user",
                content: backendRepoTree,
            },
            {
                role: "user",
                content: messagesContext,
            },
            {
                role: "user",
                content: userInput,
            },
        ];

        const result = await this.llmService.callChatOpenAI({
            model: "gpt-4o-mini",
            messages,
            nodeName: "talkToFeedback",
        });

        this.logger.log({
            message: `${this.serviceName}.talkToFeedback: Result`,
            metadata: {
                result,
            },
        });

        const assistantMessage: FeedbackMessage = {
            content: result?.content as string,
            sender: "assistant",
            timestamp: Date.now(),
        };

        feedback = await this.addMessage({
            feedback_id: feedback.id,
            project_id: payload.project_id,
            messages: [assistantMessage],
        });
        const updatedFeedback = await this.getFeedbackById(feedback.id);

        return { feedback: updatedFeedback, result };
    }

    async getLatestOngoingFeedback(project_id: string) {
        const feedback = await this.feedbackRepository.findOne({
            where: { project_id, is_submit: false },
            order: { created_at: "DESC" },
        });

        if (!feedback) {
            return {
                feedback: null,
                is_ongoing: false,
            };
        }

        return {
            feedback,
            is_ongoing: true,
        };
    }

    async submitFeedback(payload: SubmitFeedbackDto) {
        this.logger.log({
            message: `${this.serviceName}.submitFeedback: Payload`,
            metadata: {
                payload,
            },
        });

        const feedback = await this.getFeedbackById(payload.feedback_id);
        if (!feedback) {
            throw new NotFoundException("Feedback not found");
        }

        feedback.is_submit = true;
        feedback.status = "submitted";
        const result = await this.feedbackRepository.save(feedback);

        await this.developmentService.createIteration({
            project_id: feedback.project_id,
            type: IterationType.Feedback,
            feedback_id: feedback.id,
        });

        return result;
    }

    async getHistoricalFeedbacksByProjectId(project_id: string) {
        return this.feedbackRepository.find({
            where: { project_id },
            order: { created_at: "DESC" },
        });
    }
}
