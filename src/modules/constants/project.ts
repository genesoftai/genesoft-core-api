enum ProjectTemplate {
    NestJsApi = "nestjs-api-template",
    NextJsWeb = "nextjs-app-router-web-template",
    NextJsWebFirebase = "nextjs-firebase-web-template",
}

enum ProjectTemplateName {
    NestJsApi = "nestjs-api",
    NextJsWeb = "nextjs-web",
}

enum ProjectType {
    Api = "api",
    Web = "web",
}

enum ProjectTemplateType {
    Web = "web",
    WebAndBackend = "web-and-backend",
    Backend = "backend",
    Git = "git",
}

enum ProjectTemplateTypeInProjectTable {
    WebNextJs = "web_nextjs",
    BackendNestJs = "backend_nestjs",
}

export {
    ProjectTemplate,
    ProjectTemplateName,
    ProjectType,
    ProjectTemplateType,
    ProjectTemplateTypeInProjectTable,
};
