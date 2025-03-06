import {
    Inject,
    forwardRef,
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "./entity/conversation.entity";
import { ConversationMessage } from "./entity/message.entity";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UserService } from "@/modules/user/user.service";
import {
    GENESOFT_BASE_URL,
    GENESOFT_LOGO_IMAGE_URL,
    GENESOFT_SUPPORT_EMAIL_FROM,
} from "@/modules/constants/genesoft";
import { GENESOFT_SUPPORT_EMAIL } from "@/modules/constants/genesoft";
import { AiAgentId, AiAgentName } from "@/modules/constants/agent";
import { TalkToProjectManagerDto } from "./dto/talk-to-project-manger.dto";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { ProjectService } from "@/modules/project/project.service";
import { GithubService } from "@/modules/github/github.service";
import { LlmService } from "@/modules/llm/llm.service";
import { ProjectType } from "@/modules/constants/project";
import { formatGithubRepositoryTree } from "@/utils/project/documentation";
import { BaseMessageLike } from "@langchain/core/messages";
import { SubmitConversationDto } from "./dto/submit-conversation.dto";
import { EmailService } from "@/modules/email/email.service";
import { DevelopmentService } from "@/modules/development/development.service";
import { PageService } from "@/page/page.service";
import { FeatureService } from "@/feature/feature.service";
import { Iteration } from "@/modules/development/entity/iteration.entity";
import { IterationType } from "@/modules/constants/development";
import { IterationTask } from "@/modules/development/entity/iteration-task.entity";

export interface ConversationMessageForWeb extends ConversationMessage {
    sender: {
        name: string;
        email?: string;
        image?: string;
    };
}

@Injectable()
export class ConversationService {
    private readonly serviceName = ConversationService.name;
    private readonly logger = new Logger(ConversationService.name);
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(ConversationMessage)
        private messageRepository: Repository<ConversationMessage>,
        private userService: UserService,
        @Inject(forwardRef(() => ProjectService))
        private projectService: ProjectService,
        private githubService: GithubService,
        @InjectRepository(GithubRepository)
        private githubRepositoryRepository: Repository<GithubRepository>,
        private llmService: LlmService,
        private emailService: EmailService,
        @Inject(forwardRef(() => DevelopmentService))
        private developmentService: DevelopmentService,
        @Inject(forwardRef(() => PageService))
        private pageService: PageService,
        @Inject(forwardRef(() => FeatureService))
        private featureService: FeatureService,
        @InjectRepository(Iteration)
        private iterationRepository: Repository<Iteration>,
        @InjectRepository(IterationTask)
        private iterationTaskRepository: Repository<IterationTask>,
    ) {}

    async createConversation(
        createConversationDto: CreateConversationDto,
    ): Promise<Conversation> {
        const conversation = this.conversationRepository.create(
            createConversationDto,
        );
        return this.conversationRepository.save(conversation);
    }

    async findAllConversations(): Promise<Conversation[]> {
        return this.conversationRepository.find();
    }

    async findConversationById(
        id: string,
    ): Promise<Conversation & { messages: ConversationMessageForWeb[] }> {
        const conversation = await this.conversationRepository.findOne({
            where: { id },
        });
        const messages = await this.getMessagesByConversationId(id);
        if (!conversation) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
        return { ...conversation, messages };
    }

    async getMessagesByConversationId(
        conversationId: string,
    ): Promise<ConversationMessageForWeb[]> {
        const messages = await this.messageRepository.find({
            where: { conversation_id: conversationId },
            order: { created_at: "ASC" },
        });

        const finalMessages = await Promise.all(
            messages.map(async (message) => {
                if (message.sender_type === "user") {
                    const user = await this.userService.getUserById(
                        message.sender_id,
                    );

                    return {
                        ...message,
                        sender: {
                            name: user.name || user.email,
                            email: user.email,
                            image: user?.image,
                        },
                    };
                }

                return {
                    ...message,
                    sender: {
                        name: AiAgentName.GenesoftProjectManager,
                        email: GENESOFT_SUPPORT_EMAIL,
                        image: GENESOFT_LOGO_IMAGE_URL,
                    },
                };
            }),
        );

        return finalMessages;
    }

    async getActiveConversationByPageId(pageId: string): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { page_id: pageId, status: "active" },
            order: { created_at: "DESC" },
        });

        return conversation;
    }

    async getActiveConversationByFeatureId(
        featureId: string,
    ): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { feature_id: featureId, status: "active" },
            order: { created_at: "DESC" },
        });

        return conversation;
    }

    async findConversationsByPageId(pageId: string): Promise<Conversation[]> {
        return this.conversationRepository.find({ where: { page_id: pageId } });
    }

    async findConversationsByFeatureId(
        featureId: string,
    ): Promise<Conversation[]> {
        return this.conversationRepository.find({
            where: { feature_id: featureId },
        });
    }

    async findConversationsByIterationId(
        iterationId: string,
    ): Promise<Conversation[]> {
        return this.conversationRepository.find({
            where: { iteration_id: iterationId },
        });
    }

    async updateConversation(
        id: string,
        updateConversationDto: UpdateConversationDto,
    ): Promise<Conversation> {
        const conversation = await this.findConversationById(id);
        Object.assign(conversation, updateConversationDto);
        return this.conversationRepository.save(conversation);
    }

    async deleteConversation(id: string): Promise<void> {
        const result = await this.conversationRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
    }

    async archiveConversation(id: string): Promise<Conversation> {
        const conversation = await this.findConversationById(id);
        conversation.status = "archived";
        return this.conversationRepository.save(conversation);
    }

    // Message operations related to conversations
    async addMessageToConversation(
        conversationId: string,
        createMessageDto: CreateMessageDto,
    ): Promise<ConversationMessage> {
        this.logger.log({
            message: `${this.serviceName}.addMessageToConversation: Start`,
            metadata: {
                conversationId,
                createMessageDto,
            },
        });
        try {
            // Ensure the conversation exists
            const conversation =
                await this.findConversationById(conversationId);

            if (!conversation) {
                throw new NotFoundException(
                    `Conversation with ID ${conversationId} not found`,
                );
            }

            const message = this.messageRepository.create({
                ...createMessageDto,
                conversation_id: conversation.id,
            });

            return this.messageRepository.save(message);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.addMessageToConversation: Error`,
                error,
            });
            throw error;
        }
    }

    async getMessagesForConversation(
        conversationId: string,
    ): Promise<ConversationMessage[]> {
        // Ensure the conversation exists
        await this.findConversationById(conversationId);

        return this.messageRepository.find({
            where: { conversation_id: conversationId },
            order: { created_at: "ASC" },
        });
    }

    async talkToProjectManager(payload: TalkToProjectManagerDto) {
        let conversation_id = payload.conversation_id;
        if (!conversation_id) {
            const newConversation = await this.createConversation({
                project_id: payload.project_id,
                feature_id: payload.feature_id,
                page_id: payload.page_id,
            });
            conversation_id = newConversation.id;
        }

        // Get the latest iteration for the project
        const latestIteration = await this.iterationRepository.findOne({
            where: { project_id: payload.project_id },
            order: { created_at: "DESC" },
        });

        let iterationContext =
            "Remember to use sprint instead of iteration so user can understand because we use sprint wording in web UI. Don't need to talk about sprint every response message if user didn't ask something related to it.";
        if (latestIteration.type === IterationType.Project) {
            iterationContext = `
            These are the latest iteration for create the project:
            Iteration ID: ${latestIteration.id}
            Status: ${latestIteration.status}
            Type: ${latestIteration.type}
            
            If user talking to you, tell them that you are working on the project and you will get back to them soon.
            Tell them to check on development status of web application information tab.
            `;
        } else if (latestIteration.type === IterationType.PageDevelopment) {
            iterationContext = `
            These are the latest iteration for update the page:
            Iteration ID: ${latestIteration.id}
            Status: ${latestIteration.status}
            Type: ${latestIteration.type}
            `;
        } else if (latestIteration.type === IterationType.FeatureDevelopment) {
            iterationContext = `
            These are the latest iteration for update the feature:
            Iteration ID: ${latestIteration.id}
            Status: ${latestIteration.status}
            Type: ${latestIteration.type}
            `;
        } else {
            iterationContext = `
            No latest iteration found for this project.
            `;
        }

        const latestIterationTasks = await this.iterationTaskRepository.find({
            where: { iteration_id: latestIteration.id },
        });

        if (latestIterationTasks.length > 0) {
            for (const latestIterationTask of latestIterationTasks) {
                iterationContext += `
                Task: ${latestIterationTask.name}
                Status: ${latestIterationTask.status}
                Team: ${latestIterationTask.team}
                `;

                if (
                    latestIterationTask.result &&
                    latestIterationTask.result.past_steps
                ) {
                    for (const step of latestIterationTask.result.past_steps) {
                        iterationContext += `
                        - ${step}
                        `;
                    }
                }
            }
        }

        try {
            const existingConversation =
                await this.findConversationById(conversation_id);

            if (!existingConversation) {
                throw new NotFoundException("Conversation not found");
            }

            await this.addMessageToConversation(
                existingConversation.id,
                payload.message,
            );

            const updatedConversation = await this.findConversationById(
                existingConversation.id,
            );

            const formattedMessages = updatedConversation.messages.map(
                (message) => {
                    return `[${message.sender_type.toUpperCase()}] ${message.content}`;
                },
            );

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

            const messagesContext = `
            These are historical messages between users and you as a project manager:
            ${formattedMessages.join("\n")}
            `;

            const frontendRepoTreeResponse =
                await this.githubService.getRepositoryTrees({
                    repository: frontendRepository.name,
                    branch: "dev",
                });

            const frontendRepoTree = formatGithubRepositoryTree(
                frontendRepoTreeResponse,
            );

            const userInput = `
            Please answer user messages:
            ${formattedMessages.join("\n")}
            `;

            const systemMessage = `
            You are a Technical Project Manager with extensive experience in both business and technical aspects of web application development of customer project. 
            Your role is to:
            1. Facilitate friendly and constructive conversations with customers about project improvements
            2. Help collect and understand essential requirements and feedback about the project
            3. Provide clear explanations about both frontend and backend technical details when needed but keep it short and concise for non-technical users to understand
            4. Bridge the gap between business requirements and technical implementation
            5. Offer informative responses about project features, architecture, and development process
            6. Guide discussions to ensure feedback is actionable and aligned with project goals
            7. Please tell user to click on Start Sprint button when they complted the conversation to inform software development team to start the development sprint.

            Please engage in a helpful conversation while keeping both business value and technical feasibility in mind.
            `;

            const answerInstructions = `Please not use technical terms to talk with user unless user asks about it. Remember that our main target users are non-technical users. Please answer with concise and simple sentences that easy to understand and get into the point. Please answer like you are their colleague who are friendly and helpful with a sense of humor but serious on the point to make user want to talk with you like they want to work with their colleague. I want user to feel like work in the workspace like Slack when talking with you.`;
            const formatInstructions = `Please use good markdown format in the answer that you need to remark it as important information, feel free to use bold, italic, underline, code, list, etc.`;

            const messages: BaseMessageLike[] = [
                {
                    role: "user",
                    content: systemMessage,
                },
                {
                    role: "user",
                    content: projectDocumentation,
                },
                {
                    role: "user",
                    content: frontendRepoTree,
                },
                {
                    role: "user",
                    content: answerInstructions,
                },
                {
                    role: "user",
                    content: formatInstructions,
                },
                {
                    role: "user",
                    content: messagesContext,
                },
                {
                    role: "user",
                    content: iterationContext,
                },
                {
                    role: "user",
                    content: userInput,
                },
            ];

            const result = await this.llmService.callGemini({
                model: "gemini-2.0-flash",
                messages,
                nodeName: "talkToProjectManager",
            });

            this.logger.log({
                message: `${this.serviceName}.talkToProjectManager: Result`,
                metadata: {
                    result,
                },
            });

            const aiMessage: Partial<ConversationMessage> = {
                content: result?.content as string,
                sender_type: "ai_agent",
                conversation_id,
                message_type: "text",
                sender_id: AiAgentId.GenesoftProjectManager,
            };

            this.logger.log({
                message: `${this.serviceName}.talkToProjectManager: AI Message`,
                metadata: {
                    aiMessage,
                },
            });

            await this.addMessageToConversation(
                existingConversation.id,
                aiMessage as CreateMessageDto,
            );

            this.logger.log({
                message: `${this.serviceName}.talkToProjectManager: Updated Conversation`,
            });

            const updatedConversationAfterAiMessage =
                await this.findConversationById(existingConversation.id);

            return updatedConversationAfterAiMessage;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.talkToProjectManager: Error`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async submitConversation(payload: SubmitConversationDto) {
        try {
            // 1. Find the conversation
            const conversation = await this.findConversationById(
                payload.conversation_id,
            );

            if (conversation.status === "submitted") {
                throw new BadRequestException(
                    "Conversation is already submitted",
                );
            }

            const project = await this.projectService.getProjectById(
                conversation.project_id,
            );
            const users = await this.userService.getUsersByOrganizationId(
                project.organization_id,
            );
            const usersEmail = users.map((user) => user.email);
            let pageName = "";
            if (conversation.page_id) {
                const page = await this.pageService.getPage(
                    conversation.page_id,
                );
                pageName = page.name;
            }
            let featureName = "";
            if (conversation.feature_id) {
                const feature = await this.featureService.getFeature(
                    conversation.feature_id,
                );
                featureName = feature.name;
            }

            const conversationCategory = conversation.page_id
                ? "page"
                : "feature";
            const conversationChannelName =
                conversationCategory === "page" ? pageName : featureName;

            // 5. start `page/feature` iteration
            let interation;
            if (conversation.page_id) {
                interation = await this.developmentService.createPageIteration({
                    conversation_id: conversation.id,
                    project_id: conversation.project_id,
                    page_id: conversation.page_id,
                });
            } else if (conversation.feature_id) {
                interation =
                    await this.developmentService.createFeatureIteration({
                        conversation_id: conversation.id,
                        project_id: conversation.project_id,
                        feature_id: conversation.feature_id,
                    });
            }

            // 2. Update the conversation status to submitted
            conversation.status = "submitted";
            conversation.name = payload.name;
            conversation.iteration_id = interation.id;
            await this.conversationRepository.save(conversation);

            // 3. Send email to the user
            try {
                const sprintTypeForSend =
                    conversationCategory.charAt(0).toUpperCase() +
                    conversationCategory.slice(1);
                const targetId =
                    conversation.feature_id || conversation.page_id;
                await this.emailService.sendEmail({
                    to: usersEmail,
                    subject: `${sprintTypeForSend} development sprint started for ${payload.name} sprint`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Development Sprint Started!</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that the development sprint for your ${conversationCategory} has been successfully started.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project.name || "No project name provided"}<br>
                                    <strong>Sprint:</strong> ${conversation.name || "No name provided"}<br>
                                    <strong>${sprintTypeForSend}:</strong> ${conversationChannelName || "No name provided"}<br>
                                    <strong>Description:</strong> ${project.description || "No description provided"}
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now track the progress in your project dashboard.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${conversation.project_id}/${conversationCategory}s/${targetId}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your ${sprintTypeForSend}</a>
                            </div>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                                <p>If you have any questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                            </div>
                        </div>
                    `,
                    from: GENESOFT_SUPPORT_EMAIL_FROM,
                });
            } catch (error) {
                this.logger.error({
                    message: `${this.serviceName}.submitConversation: Error`,
                    metadata: { error },
                });
            }

            // 4. Create a new conversation for this page/feature
            const newConversation = await this.createConversation({
                project_id: conversation.project_id,
                page_id: conversation.page_id,
                feature_id: conversation.feature_id,
            });

            return { newConversation, interation };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.submitConversation: Error`,
                metadata: { error },
            });
            throw error;
        }
    }
}
