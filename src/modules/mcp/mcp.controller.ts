import { Body, Controller, Post } from "@nestjs/common";
import { McpService } from "./mcp.service";
import { McpDto } from "./dto/mcp.dto";

@Controller("mcp")
export class McpController {
    constructor(private readonly mcpService: McpService) {}

    @Post("query")
    async processQuery(@Body() body: McpDto) {
        await this.mcpService.connectToServer();
        return this.mcpService.processQuery(body);
    }
}
