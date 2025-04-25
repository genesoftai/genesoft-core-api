export const InitialCodebaseUnderstandingForNestjsProject = `
# --- Core Application Components ---
core_components:
  main_ts: # src/main.ts
    purpose: Bootstrap the NestJS application.
    key_settings:
      - setting: Global validation pipe
        purpose: Validates incoming requests.
      - setting: CORS configuration
        purpose: Handles cross-origin requests.
      - setting: Port configuration
        purpose: Sets the application listening port.
  
  app_module: # src/app.module.ts
    purpose: Root module that organizes the application structure.
    imports:
      - WinstonModule (logging)
      - ConfigModule (environment variables)
      - TypeOrmModule (database, conditionally loaded)
      - AppConfigurationModule
      - AuthModule
    controllers:
      - AppController
    providers:
      - AppService
      - Logger
    key_features:
      - Configures Winston for structured logging
      - Sets up global configuration with ConfigModule
      - Conditionally configures TypeORM database connection
      - Integrates authentication system

# --- Feature Modules ---
feature_modules:
  auth_module:
    location: src/modules/auth/auth.module.ts
    purpose: Handles authentication and authorization.
    components:
      - name: AuthGuard
        location: src/modules/auth/auth.guard.ts
        purpose: Protects routes requiring authentication.
        functions:
          - canActivate: using for check if user is authenticated or not
      - name: AuthorizationMiddleware
        location: src/modules/auth/authorization.middleware.ts
        purpose: Processes authorization headers and tokens.
        functions:
          - use: Attaches user information to request object

  configuration_modules:
    app_configuration:
      location: src/modules/configuration/app
      purpose: Manages application-specific configuration.
      components:
        - name: AppConfigurationModule
          location: src/modules/configuration/app/app.module.ts
          purpose: Configures application settings.
        - name: AppConfigurationService
          location: src/modules/configuration/app/app.service.ts
          purpose: Provides application configuration values including database connection.
          functions:
            - port: Get server PORT
            - apiKey: Get api key for authorization
            - databaseUrl: Get database connection string
        - name: Configuration
          location: src/modules/configuration/app/configuration.ts
          purpose: Defines application configuration schema by reading .env file or fixed values.
    
    third_party_configuration:
      location: src/modules/configuration/third-party
      purpose: Manages third-party service integrations.
      components:
        - name: ThirdPartyModule
          location: src/modules/configuration/third-party/third-party.module.ts
          purpose: Configures third-party service connections.
        - name: ThirdPartyService
          location: src/modules/configuration/third-party/third-party.service.ts
          purpose: Provides third-party configuration values.
          functions:
            - resendApiKey: Get resend api key
            - resendAudienceId: Get resend audience id
        - name: Configuration
          location: src/modules/configuration/third-party/configuration.ts
          purpose: Defines third-party configuration schema.

# --- Testing ---
testing:
  unit_tests:
    - location: src/app.controller.spec.ts
      purpose: Tests the main application controller.
  
  e2e_tests:
    - location: test/app.e2e-spec.ts
      purpose: End-to-end tests for the application.
    - location: test/jest-e2e.json
      purpose: Jest configuration for E2E testing.

# --- Configuration ---
configuration:
  environment_variables:
    location: .env.example
    purpose: Template for required environment variables.
    key_variables:
      - PORT: Server PORT
      - API_KEY: Api key for authorization
      - DATABASE_URL: PostgreSQL connection string\
      - ENVIRONMENT: Environment name
      
  typescript:
    - location: tsconfig.json
      purpose: TypeScript configuration for development.
    - location: tsconfig.build.json
      purpose: TypeScript configuration for production builds.
  
  nest_cli:
    location: nest-cli.json
    purpose: NestJS CLI configuration for project generation and builds.
`;
