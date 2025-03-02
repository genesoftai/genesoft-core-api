import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { FeatureService } from "./feature.service";
import { CreateFeatureDto } from "./dto/create-feature.dto";

@Controller("feature")
export class FeatureController {
    constructor(private readonly featureService: FeatureService) {}

    @Post()
    async createFeature(@Body() payload: CreateFeatureDto) {
        return this.featureService.createFeature(payload);
    }

    @Get(":id")
    async getFeature(@Param("id") id: string) {
        return this.featureService.getFeature(id);
    }
}
