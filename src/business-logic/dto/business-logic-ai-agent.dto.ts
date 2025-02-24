import { IsString } from "class-validator";
import { IsOptional } from "class-validator";

export class BusinessLogicAIAgentRequestDto {
    @IsString()
    @IsOptional()
    request?: string;

    @IsString()
    @IsOptional()
    data?: string;

    @IsString()
    @IsOptional()
    response?: string;
}
