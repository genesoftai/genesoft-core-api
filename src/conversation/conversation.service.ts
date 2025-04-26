import {
    Inject,
    forwardRef,
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Conversation } from "./entity/conversation.entity";
import { ConversationMessage } from "./entity/message.entity";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UserService } from "@/modules/user/user.service";
import { GENESOFT_LOGO_IMAGE_URL } from "@/modules/constants/genesoft";
import { GENESOFT_SUPPORT_EMAIL } from "@/modules/constants/genesoft";
import { AiAgentId, AiAgentName } from "@/modules/constants/agent";
import {
    TalkToBackendDeveloperDto,
    TalkToProjectManagerDto,
    TalkToWebAiAgentsDto,
} from "./dto/talk-to-project-manger.dto";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { ProjectService } from "@/modules/project/project.service";
import { GithubService } from "@/modules/github/github.service";
import { LlmService } from "@/modules/llm/llm.service";
import { ProjectTemplateType, ProjectType } from "@/modules/constants/project";
import { formatGithubRepositoryTree } from "@/utils/project/documentation";
import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { SubmitConversationDto } from "./dto/submit-conversation.dto";
import { EmailService } from "@/modules/email/email.service";
import { DevelopmentService } from "@/modules/development/development.service";
import { PageService } from "@/page/page.service";
import { FeatureService } from "@/feature/feature.service";
import { Iteration } from "@/modules/development/entity/iteration.entity";
import { IterationType } from "@/modules/constants/development";
import { IterationTask } from "@/modules/development/entity/iteration-task.entity";
import { File } from "@/modules/metadata/entity/file.entity";
import { getS3FileUrl } from "@/utils/aws/s3";
import { AWSConfigurationService } from "@/modules/configuration/aws";
import { CallGeminiPayload } from "@/modules/types/llm/gemini";
import { CallBackendDeveloperAgent } from "@/modules/types/llm/backend-agent";
import { CallFrontendDeveloperAgent } from "@/modules/types/llm/frontend-agent";

export interface ConversationMessageForWeb extends ConversationMessage {
    sender: {
        name: string;
        email?: string;
        image?: string;
    };
    files?: {
        id: string;
        url: string;
    }[];
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
        @InjectRepository(File)
        private fileRepository: Repository<File>,
        private awsConfigurationService: AWSConfigurationService,
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

                    let filesResult = [];

                    if (message.file_ids) {
                        const files = await this.fileRepository.find({
                            where: { id: In(message.file_ids) },
                        });
                        filesResult = files.map((file) => ({
                            id: file.id,
                            url: getS3FileUrl(
                                this.awsConfigurationService.awsS3BucketName,
                                this.awsConfigurationService.awsRegion,
                                file.path,
                            ),
                        }));
                    }
                    return {
                        ...message,
                        sender: {
                            name: user.name || user.email,
                            email: user.email,
                            image: user?.image,
                        },
                        files: filesResult,
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

    async getActiveConversationByProjectId(
        projectId: string,
    ): Promise<Conversation> {
        const conversation = await this.conversationRepository.findOne({
            where: { project_id: projectId, status: "active" },
            order: { created_at: "DESC" },
        });

        return conversation;
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

    async findConversationsByProjectId(
        projectId: string,
    ): Promise<Conversation[]> {
        const conversations = await this.conversationRepository.find({
            where: { project_id: projectId },
            order: { created_at: "ASC" },
        });

        return conversations;
    }

    async findConversationsWithIterationsByProjectId(
        projectId: string,
    ): Promise<Conversation[]> {
        // Create a map of iterations by ID for faster lookups
        const iterations = await this.iterationRepository.find({
            where: { project_id: projectId },
            order: { created_at: "ASC" },
        });

        const iterationMap = new Map();
        iterations.forEach((iteration) => {
            iterationMap.set(iteration.id, iteration);
        });

        // Get conversations and attach iterations in one pass
        const conversations = await this.conversationRepository.find({
            where: { project_id: projectId },
            order: { created_at: "ASC" },
        });

        const filteredConversations = conversations
            .slice(0, -1)
            .filter((conversation) => conversation.name !== null);

        return filteredConversations.map((conversation) => {
            const iteration = iterationMap.get(conversation.iteration_id);
            return { ...conversation, iteration };
        });
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

    async talkToWebAiAgents(payload: TalkToWebAiAgentsDto) {
        let conversation_id = payload.conversation_id;
        if (!conversation_id) {
            const newConversation = await this.createConversation({
                project_id: payload.project_id,
            });
            conversation_id = newConversation.id;
        }
        const userMessage = payload.message.content;
        const aiAgent =
            await this.llmService.determineAiAgentForWebConversation(
                userMessage,
            );
        if (aiAgent === "frontend_developer") {
            return this.talkToFrontendDeveloper(payload);
        } else {
            return this.talkToProjectManager(payload);
        }
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

            const frontendRepoTreeResponse =
                await this.githubService.getRepositoryTrees({
                    repository: frontendRepository.name,
                    branch: "dev",
                });

            const frontendRepoTree = formatGithubRepositoryTree(
                frontendRepoTreeResponse,
            );

            const userInput = `
            These are historical messages between users and you as a project manager:
            ${formattedMessages.join("\n")}

            Please answer user latest message:
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

            Genesoft managed infrastructure:
            - Code repository on Github.
            - Web deployment on Vercel.

            Please engage in a helpful conversation while keeping both business value and technical feasibility in mind.
            `;

            const userGuide = `
            These are important information about how to use Genesoft
            - Tell them to clicked 'generate' button (not 'start sprint' button anymore) to start trigger the development sprint (don't need to tell them every time just tell when feel like user curious about it or user ready to start development sprint).
            - If deployment is in progess mean we're deploying customer web application, it may take a while to complete around 2-3 minutes since user see deployment in progress.
            - User able to upload image in this conversation, and describe the image to Genesoft to make it easier for Genesoft to understand the user request.
            - Tell user to refresh web preview after generation completed to see latest version of their web application.

            Remark: You don't need to tell user everytime about user guide, just tell when user ask about it or user curious about something related to user guide.
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
                    content: userGuide,
                },
                {
                    role: "user",
                    content: userInput,
                },
            ];
            const messageType = payload.message.message_type;
            const geminiPayload: CallGeminiPayload = {
                payload: {
                    model: "gemini-2.0-flash",
                    messages,
                    nodeName: "talkToProjectManager",
                },
                type: messageType,
            };

            if (messageType === "image") {
                const file = await this.fileRepository.findOne({
                    where: { id: payload.message.file_ids[0] },
                });
                const imageUrl = getS3FileUrl(
                    this.awsConfigurationService.awsS3BucketName,
                    this.awsConfigurationService.awsRegion,
                    file?.path,
                );
                geminiPayload.imageUrl = imageUrl;
            }

            const result = await this.llmService.callGemini(geminiPayload);

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

    async talkToFrontendDeveloper(payload: TalkToWebAiAgentsDto) {
        let conversation_id = payload.conversation_id;
        if (!conversation_id) {
            const newConversation = await this.createConversation({
                project_id: payload.project_id,
            });
            conversation_id = newConversation.id;
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

            const frontendRepoTreeResponse =
                await this.githubService.getRepositoryTrees({
                    repository: frontendRepository.name,
                    branch: "dev",
                });

            const frontendRepoTree = formatGithubRepositoryTree(
                frontendRepoTreeResponse,
            );

            const userInput = `
            These are historical messages between users and Software dvelopment team of AI Agents (project manager and frontend developer):
            ${formattedMessages.join("\n")}

            Please answer user latest message:
            `;

            const systemMessage = `
            You are a Frontend Developer with extensive experience in Next.js 15 App Router and modern web development. 
            Your role is to:
            1. Provide technical guidance and solutions for frontend development questions
            2. Explain frontend concepts, architecture, and implementation details clearly
            3. Help users understand how their web application is structured and functions
            4. Offer code examples and best practices when appropriate
            5. Assist with troubleshooting frontend issues
            6. Provide insights on UI/UX implementation and optimization

            Technical stack information:
            - Framework: Next.js 15 App Router
            - UI Library: Tailwind CSS, Shadcn/UI
            - Payment Processing: Stripe
            - Deployment: Vercel
            - API service: Core API service that responsible for handling all backend logic and data storage by Genesoft Backend Developer AI Agent.

            Please engage in a helpful technical conversation while providing accurate and practical frontend development advice.
            `;

            const answerInstructions = `Please use appropriate technical terms when discussing frontend development concepts. Be thorough but concise in your explanations, and provide code examples when they would be helpful. Focus on practical solutions that follow best practices for Next.js 15 App Router development.`;
            const formatInstructions = `Please use good markdown format in your answers, including code blocks with proper syntax highlighting, headings, lists, and emphasis where appropriate to make technical information more readable.`;

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
                    content: userInput,
                },
            ];
            const messageType = payload.message.message_type;
            const geminiPayload: CallFrontendDeveloperAgent = {
                payload: {
                    model: "gemini-2.0-flash",
                    messages,
                    nodeName: "talkToFrontendDeveloper",
                },
                type: messageType,
                branch: "dev",
                repository: frontendRepository.name,
                projectDocumentation,
                latestRepoTree: frontendRepoTree,
            };

            if (messageType === "image") {
                const file = await this.fileRepository.findOne({
                    where: { id: payload.message.file_ids[0] },
                });
                const imageUrl = getS3FileUrl(
                    this.awsConfigurationService.awsS3BucketName,
                    this.awsConfigurationService.awsRegion,
                    file?.path,
                );
                geminiPayload.imageUrl = imageUrl;
            }

            const result =
                await this.llmService.callFrontendDeveloperAgent(geminiPayload);

            this.logger.log({
                message: `${this.serviceName}.talkToFrontendDeveloper: Result`,
                metadata: {
                    result,
                },
            });

            const content = Array.isArray(result)
                ? (result as BaseMessage[])
                      .map((item: BaseMessage) => item.text.trim())
                      .join("\n")
                : result;

            const aiMessage: Partial<ConversationMessage> = {
                content: content as string,
                sender_type: "ai_agent",
                conversation_id,
                message_type: "text",
                sender_id: AiAgentId.GenesoftFrontendDeveloper,
            };

            this.logger.log({
                message: `${this.serviceName}.talkToFrontendDeveloper: AI Message`,
                metadata: {
                    aiMessage,
                },
            });

            await this.addMessageToConversation(
                existingConversation.id,
                aiMessage as CreateMessageDto,
            );

            this.logger.log({
                message: `${this.serviceName}.talkToFrontendDeveloper: Updated Conversation`,
            });

            const updatedConversationAfterAiMessage =
                await this.findConversationById(existingConversation.id);

            return updatedConversationAfterAiMessage;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.talkToFrontendDeveloper: Error`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async talkToBackendDeveloper(payload: TalkToBackendDeveloperDto) {
        let conversation_id = payload.conversation_id;
        if (!conversation_id) {
            const newConversation = await this.createConversation({
                project_id: payload.project_id,
            });
            conversation_id = newConversation.id;
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

            const backendRepository =
                await this.githubRepositoryRepository.findOne({
                    where: {
                        project_id: payload.project_id,
                        type: ProjectType.Api,
                    },
                });

            const backendRepoTreeResponse =
                await this.githubService.getRepositoryTrees({
                    repository: backendRepository.name,
                    branch: "dev",
                });

            const backendRepoTree = formatGithubRepositoryTree(
                backendRepoTreeResponse,
            );

            const userInput = `
            These are historical messages between users and you as a backend developer:
            ${formattedMessages.join("\n")}

            Please answer user latest message:
            `;

            const systemMessage = `
            You are a Senior Backend Developer with extensive experience in NestJS and modern backend architecture. 
            Your role is to:
            1. Provide technical guidance on backend implementation details, API design, and database architecture
            2. Explain complex backend concepts clearly to other software engineers
            3. Discuss technical tradeoffs and best practices for NestJS applications
            4. Offer code-level suggestions and architectural recommendations
            5. Help troubleshoot backend issues and optimize performance
            6. Share insights about NestJS modules, dependency injection, middleware, and other framework-specific features

           <tech_stack>
                - Framework: NestJS
                - Language: TypeScript
                - Database: PostgreSQL (or specify based on project, e.g., MongoDB, MySQL)
                - ORM: TypeORM (or specify, e.g., Prisma, Mongoose)
                - Authentication: JWT, Passport.js (or other specified methods)
                - API Specification: OpenAPI (Swagger)
                - Validation: class-validator, class-transformer
                - Testing: Jest, Supertest
                - Containerization: Docker (optional but recommended)
                - Caching: Redis (optional)
                - Asynchronous Tasks: Queues (e.g., BullMQ) (optional)
                - Logging: Nestjs Logger (setup with nest-winston, winston)
            </tech_stack>


            Please engage in detailed technical discussions while providing practical, implementation-focused advice.
            `;

            const userGuide = `
            These are important technical capabilities of the Genesoft backend:
            - NestJS modules are organized following domain-driven design principles
            - API endpoints follow RESTful conventions with proper status codes and error handling
            - Database migrations are handled automatically through TypeORM
            - Authentication uses JWT with refresh token rotation
            - Rate limiting and security middleware are implemented at the application level
            - Logging uses Winston with structured JSON format
            - Environment configuration uses NestJS ConfigModule with validation
            - Testing includes unit, integration and e2e tests with Jest
            
            Feel free to discuss implementation details, architectural patterns, and code organization strategies.
            `;

            const answerInstructions = `You can use technical terms freely as you're speaking with a software engineer. Provide code examples when relevant, discuss architectural patterns, and don't shy away from technical depth. Feel free to reference specific NestJS features, TypeORM capabilities, or backend design patterns. Your answers should be technically precise while remaining practical and implementation-focused. Make it user friendly and easy to understand like you are the great colleague user want to work with.`;

            const formatInstructions = `Use markdown formatting to enhance your explanations:
            - Code blocks with syntax highlighting for code examples
            - Bullet points for listing options or steps
            - Bold for emphasizing important concepts
            - Tables when comparing different approaches
            - Headings to organize longer responses`;

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
                    content: backendRepoTree,
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
                    content: userGuide,
                },
                {
                    role: "user",
                    content: userInput,
                },
            ];
            const messageType = payload.message.message_type;
            const geminiPayload: CallBackendDeveloperAgent = {
                payload: {
                    model: "gemini-2.0-flash",
                    messages,
                    nodeName: "talkToBackendDeveloper",
                },
                type: messageType,
                branch: "dev",
                repository: backendRepository.name,
            };

            if (messageType === "image") {
                const file = await this.fileRepository.findOne({
                    where: { id: payload.message.file_ids[0] },
                });
                const imageUrl = getS3FileUrl(
                    this.awsConfigurationService.awsS3BucketName,
                    this.awsConfigurationService.awsRegion,
                    file?.path,
                );
                geminiPayload.imageUrl = imageUrl;
            }

            const result =
                await this.llmService.callBackendDeveloperAgent(geminiPayload);
            // const contentFromResult = result;
            this.logger.log({
                message: `${this.serviceName}.talkToBackendDeveloper: Result`,
                metadata: {
                    result,
                },
            });

            const content = Array.isArray(result)
                ? (result as BaseMessage[])
                      .map((item: BaseMessage) => item.text.trim())
                      .join("\n")
                : result;

            const aiMessage: Partial<ConversationMessage> = {
                content: content as string,
                sender_type: "ai_agent",
                conversation_id,
                message_type: "text",
                sender_id: AiAgentId.GenesoftBackendDeveloper,
            };

            this.logger.log({
                message: `${this.serviceName}.talkToBackendDeveloper: AI Message`,
                metadata: {
                    aiMessage,
                },
            });

            await this.addMessageToConversation(
                existingConversation.id,
                aiMessage as CreateMessageDto,
            );

            this.logger.log({
                message: `${this.serviceName}.talkToBackendDeveloper: Updated Conversation`,
            });

            const updatedConversationAfterAiMessage =
                await this.findConversationById(existingConversation.id);

            return updatedConversationAfterAiMessage;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.talkToBackendDeveloper: Error`,
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

            const conversationName =
                await this.llmService.generateConversationName(
                    conversation.messages,
                );

            const project = await this.projectService.getProjectById(
                conversation.project_id,
            );

            const organizationId = project.organization_id;

            const monthlyIterations =
                await this.developmentService.getMonthlyIterationsOfOrganization(
                    organizationId,
                );

            this.logger.log({
                message: `${this.serviceName}.submitConversation: Monthly Iterations`,
                metadata: { monthlyIterations },
            });

            if (
                monthlyIterations.tier === "free" &&
                monthlyIterations.exceeded
            ) {
                throw new BadRequestException(
                    "You have exceeded the maximum number of sprints for free tier. Please upgrade to a startup plan to continue.",
                );
            }

            // const users =
            //     await this.userService.getUsersByOrganizationId(organizationId);
            // const usersEmail = users.map((user) => user.email);

            // TODO: revamp to only 1 type of iteration -> create core development iteration
            const interation = await this.developmentService.createIteration({
                conversation_id: conversation.id,
                project_id: conversation.project_id,
                type: IterationType.CoreDevelopment,
                is_supabase_integration: false,
                project_template_type: project.project_template_type.startsWith(
                    "backend",
                )
                    ? ProjectTemplateType.Backend
                    : ProjectTemplateType.Web,
                sandbox_id: project?.sandbox_id,
            });

            // 2. Update the conversation status to submitted
            conversation.status = "submitted";
            conversation.name = conversationName;
            conversation.iteration_id = interation.id;
            await this.conversationRepository.save(conversation);

            // 3. Send email to the user
            // try {
            //     await this.emailService.sendEmail({
            //         to: usersEmail,
            //         subject: `${project.name} web application development started for ${conversationName} generation`,
            //         html: `
            //             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            //                 <div style="text-align: center; margin-bottom: 20px;">
            //                     <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
            //                 </div>
            //                 <h2 style="color: #4a86e8; margin-bottom: 20px;">Development Sprint Started!</h2>
            //                 <p style="font-size: 16px; line-height: 1.5; color: #333;">
            //                     We're pleased to inform you that the development sprint has been successfully started.
            //                 </p>
            //                 <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            //                     <p style="margin: 0; font-size: 15px;">
            //                         <strong>Project:</strong> ${project.name || "No project name provided"}<br>
            //                         <strong>Generation:</strong> ${conversation.name || "No name provided"}<br>
            //                     </p>
            //                 </div>
            //                 <p style="font-size: 16px; line-height: 1.5; color: #333;">
            //                     You can now track the progress in your project dashboard.
            //                 </p>
            //                 <div style="text-align: center; margin: 25px 0;">
            //                     <a href="${GENESOFT_BASE_URL}/dashboard/project/${conversation.project_id}/ai-agent" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Project</a>
            //                 </div>
            //                 <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
            //                     <p>If you have any questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
            //                 </div>
            //             </div>
            //         `,
            //         from: GENESOFT_SUPPORT_EMAIL_FROM,
            //     });
            // } catch (error) {
            //     this.logger.error({
            //         message: `${this.serviceName}.submitConversation: Error`,
            //         metadata: { error },
            //     });
            // }

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
