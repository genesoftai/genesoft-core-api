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
}

export {
    ProjectTemplate,
    ProjectTemplateName,
    ProjectType,
    ProjectTemplateType,
};
