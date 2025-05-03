import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { OnboardingConversation } from "./entity/onboarding-conversation.entity";
import { OnboardingConversationMessage } from "./entity/onboarding-conversation-message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";
import { GENESOFT_LOGO_IMAGE_URL } from "@/modules/constants/genesoft";
import { GENESOFT_SUPPORT_EMAIL } from "@/modules/constants/genesoft";
import { AiAgentId, AiAgentName } from "@/modules/constants/agent";
import { TalkToAiAgentDto } from "./dto/talk-to-ai-agents.dto";
import { LlmService } from "@/modules/llm/llm.service";
import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { SubmitConversationDto } from "./dto/submit-conversation.dto";
import { File } from "@/modules/metadata/entity/file.entity";
import { getS3FileUrl } from "@/utils/aws/s3";
import { AWSConfigurationService } from "@/modules/configuration/aws";
import { CallGeminiPayload } from "@/modules/types/llm/gemini";
import { AiAgentNameId } from "../constants/onboarding-conversation";
import { GoogleGeminiModel } from "../constants/llm";
import { UpdateConversationDto } from "./dto/update-conversation.dto";

export interface ConversationMessageForWeb
    extends OnboardingConversationMessage {
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
export class OnboardingConversationService {
    private readonly serviceName = OnboardingConversationService.name;
    private readonly logger = new Logger(OnboardingConversationService.name);

    constructor(
        @InjectRepository(OnboardingConversation)
        private onboardingConversationRepository: Repository<OnboardingConversation>,
        @InjectRepository(OnboardingConversationMessage)
        private onboardingConversationMessageRepository: Repository<OnboardingConversationMessage>,
        private llmService: LlmService,
        @InjectRepository(File)
        private fileRepository: Repository<File>,
        private awsConfigurationService: AWSConfigurationService,
    ) {}

    async createConversation(): Promise<OnboardingConversation> {
        return this.onboardingConversationRepository.save({});
    }

    async findAllConversations(): Promise<OnboardingConversation[]> {
        return this.onboardingConversationRepository.find();
    }

    async findConversationById(
        id: string,
    ): Promise<
        OnboardingConversation & { messages: ConversationMessageForWeb[] }
    > {
        const conversation =
            await this.onboardingConversationRepository.findOne({
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
        const messages =
            await this.onboardingConversationMessageRepository.find({
                where: { onboarding_conversation_id: conversationId },
                order: { created_at: "ASC" },
            });

        const finalMessages = await Promise.all(
            messages.map(async (message) => {
                if (message.sender_type === "user") {
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
                            name: "onboarding_user",
                            email: "onboarding_user@genesoft.com",
                            image: "https://genesoftai.com/assets/genesoft-logo-blue.png",
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

    async updateConversation(
        id: string,
        updateConversationDto: UpdateConversationDto,
    ): Promise<OnboardingConversation> {
        await this.onboardingConversationRepository.update(
            id,
            updateConversationDto,
        );
        return this.onboardingConversationRepository.findOne({ where: { id } });
    }

    async deleteConversation(id: string): Promise<void> {
        const result = await this.onboardingConversationRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Conversation with ID ${id} not found`);
        }
    }

    async archiveConversation(id: string): Promise<OnboardingConversation> {
        const conversation = await this.findConversationById(id);
        conversation.status = "archived";
        return this.onboardingConversationRepository.save(conversation);
    }

    // Message operations related to conversations
    async addMessageToConversation(
        conversationId: string,
        createMessageDto: CreateMessageDto,
    ): Promise<OnboardingConversationMessage> {
        this.logger.log({
            message: `${this.serviceName}.addMessageToConversation: Start`,
            metadata: {
                conversationId,
                createMessageDto,
            },
        });
        try {
            const conversation =
                await this.findConversationById(conversationId);

            if (!conversation) {
                throw new NotFoundException(
                    `Conversation with ID ${conversationId} not found`,
                );
            }

            const message = this.onboardingConversationMessageRepository.create(
                {
                    ...createMessageDto,
                    onboarding_conversation_id: conversation.id,
                },
            );

            return this.onboardingConversationMessageRepository.save(message);
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
    ): Promise<OnboardingConversationMessage[]> {
        // Ensure the conversation exists
        await this.findConversationById(conversationId);

        return this.onboardingConversationMessageRepository.find({
            where: { onboarding_conversation_id: conversationId },
            order: { created_at: "ASC" },
        });
    }

    async talkToOnboardingConversationAiAgents(payload: TalkToAiAgentDto) {
        let conversation_id = payload.conversation_id;
        if (!conversation_id) {
            const newConversation = await this.createConversation();
            conversation_id = newConversation.id;
        }
        const userMessage = payload.message.content;
        const conversation = await this.findConversationById(conversation_id);
        const formattedMessages =
            conversation.messages
                .map((message) => {
                    return `[${message.sender_type.toUpperCase()}] ${message.content}`;
                })
                .join("\n") +
            `\n\nLatest message from user: [user] ${userMessage}`;
        const aiAgent =
            await this.llmService.determineAiAgentForOnboardingConversation(
                formattedMessages,
            );
        const result = await this.talkToAiAgent(payload, aiAgent);
        return result;
    }

    async talkToAiAgent(payload: TalkToAiAgentDto, agentName: string) {
        switch (agentName) {
            case AiAgentNameId.ProjectManager:
                return this.talkToBasicAiAgent(
                    payload,
                    AiAgentNameId.ProjectManager,
                );
            case "uxui_designer":
                return this.talkToBasicAiAgent(
                    payload,
                    AiAgentNameId.UxUiDesigner,
                );
            case AiAgentNameId.FrontendDeveloper:
                return this.talkToBasicAiAgent(
                    payload,
                    AiAgentNameId.FrontendDeveloper,
                );
            case AiAgentNameId.SoftwareArchitect:
                return this.talkToBasicAiAgent(
                    payload,
                    AiAgentNameId.SoftwareArchitect,
                );
            case AiAgentNameId.BackendDeveloper:
                return this.talkToBasicAiAgent(
                    payload,
                    AiAgentNameId.BackendDeveloper,
                );
            default:
                return this.talkToBasicAiAgent(
                    payload,
                    AiAgentNameId.ProjectManager,
                );
        }
    }
    async talkToBasicAiAgent(
        payload: TalkToAiAgentDto,
        agentRole = AiAgentNameId.ProjectManager,
    ) {
        const conversation_id = payload.conversation_id;

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

            const userInput = `
            These are historical messages between users and software development team of AI Agents:
            ${formattedMessages.join("\n")}

            Please answer user latest message:
            `;

            let systemMessage = "";
            let answerInstructions = "";
            let formatInstructions = "";
            let userGuide = "";
            let nodeName = "";
            let senderId = "";

            // Set prompts based on agent role
            switch (agentRole) {
                case AiAgentNameId.ProjectManager:
                    systemMessage = `
                    You are a Project Manager with extensive experience in project management overview of web application development of customer project. 
                    Your role is to:
                    1. Facilitate friendly and constructive conversations with customers about project improvements
                    2. Help collect and understand essential requirements and feedback about the project
                    3. Bridge the gap between business requirements and implementation
                    4. Offer informative responses about project features, user experience, and development process
                    5. Guide discussions to ensure feedback is actionable and aligned with project goals

                    Genesoft can manage infrastructure for user's project:
                    - Code repository on Github.
                    - Development environment on CodeSandbox.
                    - Web deployment on Vercel.
                    - Backend service deployment with Genesoft managed infrastructure.
                    - Database with Genesoft managed infrastructure.
                    - Authentication with Genesoft managed infrastructure.

                    Please engage in a helpful conversation while keeping both business value and technical feasibility in mind.
                    `;
                    answerInstructions = `Please not use technical terms to talk with user unless user asks about it. Remember that our main target users are non-technical users. Please answer with concise and simple sentences that easy to understand and get into the point. Please answer like you are their colleague who are friendly and helpful with a sense of humor but serious on the point to make user want to talk with you like they want to work with their colleague. I want user to feel like work in the workspace like Slack when talking with you.`;
                    formatInstructions = `Please use good markdown format in the answer that you need to remark it as important information, feel free to use bold, italic, underline, code, list, etc.`;
                    nodeName = "talkToProjectManager";
                    senderId = AiAgentId.GenesoftProjectManager;
                    break;

                case AiAgentNameId.UxUiDesigner:
                    systemMessage = `
                    You are a Senior UX/UI Designer with extensive experience in web application design and user experience. 
                    Your role is to:
                    1. Provide guidance on user interface design, user experience, and visual aesthetics
                    2. Explain design principles, patterns, and best practices for web applications
                    3. Help users understand how design choices impact user engagement and satisfaction
                    4. Offer insights on information architecture, interaction design, and usability
                    5. Assist with design-related questions and provide recommendations for improvements
                    6. Share knowledge about design systems, accessibility, and responsive design

                    Design approach information:
                    - Design System: Tailwind CSS, Shadcn/UI components
                    - Responsive Design: Mobile-first approach
                    - Accessibility: WCAG 2.1 AA compliance
                    - User Research: Persona-based design thinking
                    - Prototyping: Low and high-fidelity wireframes
                    - Visual Design: Modern, clean aesthetic with strong typography

                    Please engage in a helpful conversation about design while providing practical and user-centered advice.
                    `;
                    answerInstructions = `Use design terminology appropriately based on the user's level of understanding. Be visual in your descriptions, and explain design concepts in ways that help users understand the reasoning behind design decisions. Focus on how design choices impact user experience and business outcomes.`;
                    formatInstructions = `Use markdown formatting effectively to enhance your explanations:
                    - Use bullet points for listing design options or principles
                    - Bold text for emphasizing key design concepts
                    - Create clear visual hierarchy in your responses
                    - Use headings to organize longer responses
                    - Include emoji occasionally to add visual interest where appropriate`;
                    nodeName = "talkToUxUiDesigner";
                    senderId = AiAgentId.GenesoftUxUiDesigner;
                    break;

                case AiAgentNameId.FrontendDeveloper:
                    systemMessage = `
                    You are a Senior Frontend Developer with extensive experience in Next.js 15 App Router and modern web development. 
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
                    answerInstructions = `Please use appropriate technical terms when discussing frontend development concepts. Be thorough but concise in your explanations, and provide code examples when they would be helpful. Focus on practical solutions that follow best practices for Next.js 15 App Router development.`;
                    formatInstructions = `Please use good markdown format in your answers, including code blocks with proper syntax highlighting, headings, lists, and emphasis where appropriate to make technical information more readable.`;
                    nodeName = "talkToFrontendDeveloper";
                    senderId = AiAgentId.GenesoftFrontendDeveloper;
                    break;

                case AiAgentNameId.SoftwareArchitect:
                    systemMessage = `
                    You are a Senior Software Architect with extensive experience in designing scalable, maintainable software systems.
                    Your role is to:
                    1. Provide high-level architectural guidance for web application development
                    2. Explain system design patterns, architectural tradeoffs, and best practices
                    3. Help users understand how different components of their system interact
                    4. Offer insights on API design, service integration, and data flow
                    5. Assist with architectural decisions that impact scalability, performance, and security
                    6. Share knowledge about cloud services, infrastructure, and deployment strategies

                    Technical expertise:
                    - Architecture Patterns: Microservices, Serverless, Event-driven
                    - Cloud Platforms: AWS, Azure, GCP
                    - API Design: REST, GraphQL, gRPC
                    - Database Systems: SQL, NoSQL, Data warehousing
                    - Infrastructure as Code: Terraform, CloudFormation
                    - DevOps: CI/CD pipelines, Containerization, Kubernetes
                    - Security: Authentication, Authorization, Data protection

                    Please engage in detailed architectural discussions while providing practical, implementation-focused advice.
                    `;
                    userGuide = `
                    These are important architectural principles of Genesoft projects:
                    - Separation of concerns between frontend and backend services
                    - API-first design approach with comprehensive documentation
                    - Cloud-native architecture leveraging managed services when possible
                    - Security by design with proper authentication and authorization
                    - Scalable data storage with appropriate caching strategies
                    - Observability through logging, monitoring, and alerting
                    - Infrastructure as code for reproducible environments
                    
                    Feel free to discuss architectural patterns, system design, and technology selection strategies.
                    `;
                    answerInstructions = `You can use technical terms freely as you're speaking with someone interested in software architecture. Provide diagrams or conceptual models when relevant, discuss architectural patterns, and don't shy away from technical depth. Your answers should balance high-level architectural vision with practical implementation considerations.`;
                    formatInstructions = `Use markdown formatting to enhance your explanations:
                    - Bullet points for listing architectural options or principles
                    - Bold for emphasizing important concepts
                    - Headings to organize longer responses
                    - Simple ASCII diagrams when helpful to illustrate architecture
                    - Tables when comparing different approaches or technologies`;
                    nodeName = "talkToSoftwareArchitect";
                    senderId = AiAgentId.GenesoftSoftwareArchitect;
                    break;

                case AiAgentNameId.BackendDeveloper:
                    systemMessage = `
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
                    userGuide = `
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
                    answerInstructions = `You can use technical terms freely as you're speaking with a software engineer. Provide code examples when relevant, discuss architectural patterns, and don't shy away from technical depth. Feel free to reference specific NestJS features, TypeORM capabilities, or backend design patterns. Your answers should be technically precise while remaining practical and implementation-focused. Make it user friendly and easy to understand like you are the great colleague user want to work with.`;
                    formatInstructions = `Use markdown formatting to enhance your explanations:
                    - Code blocks with syntax highlighting for code examples
                    - Bullet points for listing options or steps
                    - Bold for emphasizing important concepts
                    - Tables when comparing different approaches
                    - Headings to organize longer responses`;
                    nodeName = "talkToBackendDeveloper";
                    senderId = AiAgentId.GenesoftBackendDeveloper;
                    break;

                default:
                    // Default to Project Manager if unknown role
                    systemMessage = `
                    You are a Project Manager with extensive experience in project management overview of web application development of customer project. 
                    Your role is to:
                    1. Facilitate friendly and constructive conversations with customers about project improvements
                    2. Help collect and understand essential requirements and feedback about the project
                    3. Bridge the gap between business requirements and implementation
                    4. Offer informative responses about project features, user experience, and development process
                    5. Guide discussions to ensure feedback is actionable and aligned with project goals

                    Genesoft can manage infrastructure for user's project:
                    - Code repository on Github.
                    - Development environment on CodeSandbox.
                    - Web deployment on Vercel.
                    - Backend service deployment with Genesoft managed infrastructure.
                    - Database with Genesoft managed infrastructure.
                    - Authentication with Genesoft managed infrastructure.

                    Please engage in a helpful conversation while keeping both business value and technical feasibility in mind.
                    `;
                    answerInstructions = `Please not use technical terms to talk with user unless user asks about it. Remember that our main target users are non-technical users. Please answer with concise and simple sentences that easy to understand and get into the point. Please answer like you are their colleague who are friendly and helpful with a sense of humor but serious on the point to make user want to talk with you like they want to work with their colleague. I want user to feel like work in the workspace like Slack when talking with you.`;
                    formatInstructions = `Please use good markdown format in the answer that you need to remark it as important information, feel free to use bold, italic, underline, code, list, etc.`;
                    nodeName = "talkToProjectManager";
                    senderId = AiAgentId.GenesoftProjectManager;
            }

            // Build messages array
            const messages: BaseMessageLike[] = [
                {
                    role: "user",
                    content: systemMessage,
                },
            ];

            // Add userGuide if it exists (for backend developer)
            if (userGuide) {
                messages.push({
                    role: "user",
                    content: userGuide,
                });
            }

            messages.push(
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
            );

            const messageType = payload.message.message_type;
            const geminiPayload: CallGeminiPayload = {
                payload: {
                    model: GoogleGeminiModel.Gemini_2_5_Flash,
                    messages,
                    nodeName,
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

            const response = await this.llmService.callGemini(geminiPayload);
            const result = response.content;

            this.logger.log({
                message: `${this.serviceName}.${nodeName}: Result`,
                metadata: {
                    result,
                },
            });

            const content = Array.isArray(result)
                ? (result as BaseMessage[])
                      .map((item: BaseMessage) => item.text.trim())
                      .join("\n")
                : result;

            const aiMessage: Partial<OnboardingConversationMessage> = {
                content: content as string,
                sender_type: "ai_agent",
                onboarding_conversation_id: conversation_id,
                message_type: "text",
                sender_id: senderId,
            };

            this.logger.log({
                message: `${this.serviceName}.${nodeName}: AI Message`,
                metadata: {
                    aiMessage,
                },
            });

            await this.addMessageToConversation(
                existingConversation.id,
                aiMessage as CreateMessageDto,
            );

            this.logger.log({
                message: `${this.serviceName}.${nodeName}: Updated Conversation`,
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

            this.updateConversation(conversation.id, {
                status: "submitted",
            });

            return { conversation };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.submitConversation: Error`,
                metadata: { error },
            });
            throw error;
        }
    }
}
