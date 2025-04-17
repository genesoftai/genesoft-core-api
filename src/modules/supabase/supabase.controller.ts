import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { CreateSupabaseProjectDto } from "./dto/create-supabase-project.dto";

@Controller("supabase")
export class SupabaseController {
    constructor(private supabaseService: SupabaseService) {}

    @Post()
    createSupabaseProject(
        @Body() createSupabaseProjectDto: CreateSupabaseProjectDto,
    ) {
        return this.supabaseService.createNewSupabaseProject(
            createSupabaseProjectDto.projectId,
        );
    }

    @Get(":projectId")
    getSupabaseProject(@Param("projectId") projectId: string) {
        return this.supabaseService.getSupabaseProject(projectId);
    }

    @Delete(":projectId")
    deleteSupabaseProject(@Param("projectId") projectId: string) {
        return this.supabaseService.deleteSupabaseProject(projectId);
    }

    @Get(":projectId/keys/:keyName")
    getSupabaseDBKeys(
        @Param("projectId") projectId: string,
        @Param("keyName") keyName: string,
    ) {
        return this.supabaseService.getKeyInfoFromProjectApiKeys(
            projectId,
            keyName,
        );
    }

    @Get(":supabaseProjectId/api-keys")
    getProjectApiKeys(@Param("supabaseProjectId") supabaseProjectId: string) {
        return this.supabaseService.getProjectApiKeys(supabaseProjectId);
    }

    @Get("/database/:projectId")
    getSupabaseDBUrl(@Param("projectId") projectId: string) {
        return this.supabaseService.getSupabaseDBUrl(projectId);
    }

    @Post("/database/:projectId/query")
    executeSqlQueryWithPostgres(
        @Param("projectId") projectId: string,
        @Body() body: { query: string },
    ) {
        return this.supabaseService.executeSqlQueryWithPostgres(
            projectId,
            body.query,
        );
    }

    @Get("/database/:projectId/structure")
    getDatabaseStructure(@Param("projectId") projectId: string) {
        return this.supabaseService.getDatabaseStructure(projectId);
    }


    @Get("/github-username/:uId")
    getGithubUsername(@Param("uId") uId: string) {
        return this.supabaseService.getGithubUsername(uId);
    }
}
