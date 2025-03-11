import { Injectable, Logger } from "@nestjs/common";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";
import { ProjectService } from "../project/project.service";
import { McpDto } from "./dto/mcp.dto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { GithubConfigurationService } from "../configuration/github";
import Anthropic from "@anthropic-ai/sdk";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
    MessageParam,
    Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
// import { createTransport } from "@smithery/sdk";

@Injectable()
export class McpService {
    private readonly serviceName = McpService.name;
    private readonly logger = new Logger(this.serviceName);
    private mcp: Client;
    private anthropic: Anthropic;
    // private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];

    constructor(
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
        private readonly projectService: ProjectService,
        private readonly githubConfigurationService: GithubConfigurationService,
    ) {
        this.anthropic = new Anthropic({
            apiKey: this.thirdPartyConfigurationService.anthropicApiKey,
        });
        this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
    }

    // async setupContext() {
    //     await this.connectToServer();
    // }
    // async processQuery(payload: McpDto) {
    //     const { projectId, frontendRepoName, branch, input } = payload;

    //     try {
    //         // Dynamically import the ESM module using dynamic import
    //         const mcpAdapters = await import("langchainjs-mcp-adapters");
    //         const { MultiServerMCPClient } = mcpAdapters;
    //         this.client = new MultiServerMCPClient();

    //         await this.client.connectToServerViaStdio("github", "npx", [
    //             "-y",
    //             "@modelcontextprotocol/server-github",
    //         ]);

    //         // Get tools
    //         const tools = this.client.getTools();

    //         // Create an agent
    //         const model = new ChatOpenAI({ temperature: 0 });

    //         const coreDeveloperSystemPrompt = `
    //         You are a helpful full stack NextJS developer for develop web application.
    //         You are given a task to develop a feature for a website.
    //         Push code of your changes to this github repo: gensoftai/${frontendRepoName}
    //         push code to ${branch} branch. with entire file of changes for specific file path.
    //         `;

    //         const documentation =
    //             await this.projectService.getOverallProjectDocumentation(
    //                 projectId,
    //             );
    //         const githubCommitter = {
    //             name: "khemmapichpanyana",
    //             email: "khemmapich@gmail.com",
    //         };

    //         const prompt = ChatPromptTemplate.fromMessages([
    //             ["system", coreDeveloperSystemPrompt],
    //             ["human", `Project Documentation: ${documentation}`],
    //             ["human", `use this as a Github committer: ${githubCommitter}`],
    //             ["human", `The user input is ${input}.`],
    //         ]);

    //         const agent = createReactAgent({
    //             llm: model,
    //             tools: Array.from(
    //                 tools.values(),
    //             ).flat() as ToolInterface<any>[],
    //             prompt,
    //         });

    //         const agentExecutor = new AgentExecutor({
    //             agent: await agent,
    //             tools: Array.from(
    //                 tools.values(),
    //             ).flat() as StructuredToolInterface<any>[],
    //         });

    //         // Run the agent
    //         const result = await agentExecutor.invoke({
    //             input: input,
    //         });

    //         this.logger.log({
    //             message: "MCP server response",
    //             response: result.output,
    //         });

    //         // Close the client when done
    //         await this.client.close();

    //         return result.output;
    //     } catch (error) {
    //         this.logger.error({
    //             message: "Failed to process core development agent with MCP",
    //             error,
    //         });

    //         // Make sure to close the client even if there's an error
    //         try {
    //             if (this.client) {
    //                 await this.client.close();
    //             }
    //         } catch (closeError) {
    //             this.logger.error({
    //                 message: "Error closing MCP client",
    //                 error: closeError,
    //             });
    //         }

    //         throw error;
    //     }
    // }

    async connectToServer() {
        try {
            // const transport = new StdioClientTransport({
            //     command: "npx",
            //     args: ["-y", "@modelcontextprotocol/server-github"],
            //     env: {
            //         GITHUB_ACCESS_TOKEN:
            //             this.githubConfigurationService.githubAccessToken,
            //     },
            // });
            const { createTransport } = await import("@smithery/sdk");
            const transport = createTransport(
                "https://server.smithery.ai/@smithery-ai/github",
                {
                    githubPersonalAccessToken:
                        this.githubConfigurationService.githubAccessToken,
                },
            );
            // this.transport = transport;

            await this.mcp.connect(transport);

            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                };
            });
            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name),
            );
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    async processQuery(payload: McpDto) {
        const { projectId, frontendRepoName, branch, input } = payload;
        const coreDeveloperSystemPrompt = `
        You are a helpful full stack NextJS developer for develop web application.
        You are given a task to develop a feature for a website.
        Push code of your changes to this github repo: gensoftai/${frontendRepoName}
        push code to ${branch} branch. with entire file of changes for specific file path.
        `;

        const documentation =
            await this.projectService.getOverallProjectDocumentation(projectId);
        const githubCommitter = {
            name: "khemmapichpanyana",
            email: "khemmapich@gmail.com",
        };

        const messages: MessageParam[] = [
            {
                role: "user",
                content: coreDeveloperSystemPrompt,
            },
            {
                role: "user",
                content: `Project Documentation: ${documentation}`,
            },
            {
                role: "user",
                content: `use this as a Github committer: ${githubCommitter}`,
            },
            {
                role: "user",
                content: `The user input is ${input}.`,
            },
        ];

        // const prompt = ChatPromptTemplate.fromMessages([
        //     ["system", coreDeveloperSystemPrompt],
        //     ["human", `Project Documentation: ${documentation}`],
        //     ["human", `use this as a Github committer: ${githubCommitter}`],
        //     ["human", `The user input is ${input}.`],
        // ]);

        try {
            const response = await this.anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 8192,
                messages,
                tools: this.tools,
            });

            this.logger.log({
                message: "MCP server response",
                response: response.content,
            });

            const finalText = [];
            const toolResults = [];

            for (const content of response.content) {
                if (content.type === "text") {
                    finalText.push(content.text);
                } else if (content.type === "tool_use") {
                    const toolName = content.name;
                    const toolArgs = content.input as
                        | { [x: string]: unknown }
                        | undefined;

                    const result = await this.mcp.callTool({
                        name: toolName,
                        arguments: toolArgs,
                    });
                    toolResults.push(result);
                    finalText.push(
                        `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`,
                    );

                    messages.push({
                        role: "user",
                        content: result.content as string,
                    });

                    const response = await this.anthropic.messages.create({
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 1000,
                        messages,
                    });

                    finalText.push(
                        response.content[0].type === "text"
                            ? response.content[0].text
                            : "",
                    );
                }
            }

            return finalText.join("\n");
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.processQuery: Failed to process core development agent with MCP`,
                error,
            });
            throw error;
        }
    }
}
