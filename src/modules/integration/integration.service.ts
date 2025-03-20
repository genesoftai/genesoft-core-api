import { Injectable, Logger } from "@nestjs/common";
import { FrontendInfraService } from "../frontend-infra/frontend-infra.service";
import { UpdateEnvironmentVariablesDto } from "./dto/update-env-vars.dto";

@Injectable()
export class IntegrationService {
    private readonly serviceName = "IntegrationService";
    private readonly logger = new Logger(IntegrationService.name);

    constructor(private readonly frontendInfraService: FrontendInfraService) {}

    async getVercelProjectEnvVars(project_id: string) {
        const vercelProjectEnvVars =
            await this.frontendInfraService.getVercelProjectEnvVars(project_id);
        return vercelProjectEnvVars;
    }
    async getFirebaseProjectEnvVars(project_id: string) {
        try {
            const vercelProjectEnvVars =
                await this.frontendInfraService.getVercelProjectEnvVars(
                    project_id,
                );

            const firebaseProjectEnvVars = vercelProjectEnvVars.envs
                .filter((env) => env.key.startsWith("NEXT_PUBLIC_FIREBASE"))
                .reduce((acc, env) => {
                    acc[env.key] = {
                        type: env.type,
                        value: env.value,
                        target: env.target,
                        id: env.id,
                        createdAt: env.createdAt,
                        updatedAt: env.updatedAt,
                        createdBy: env.createdBy,
                        lastEditedByDisplayName: env.lastEditedByDisplayName,
                    };
                    return acc;
                }, {});

            return firebaseProjectEnvVars;
        } catch (error) {
            this.logger.error(
                `Error getting Firebase project environment variables: ${error.message}`,
            );
            throw error;
        }
    }

    async getStripeProjectEnvVars(project_id: string) {
        try {
            const vercelProjectEnvVars =
                await this.frontendInfraService.getVercelProjectEnvVars(
                    project_id,
                );

            const stripeEnvKeys = [
                "STRIPE_SECRET_KEY",
                "STRIPE_WEBHOOK_SECRET",
            ];
            const stripeProjectEnvVars = stripeEnvKeys.reduce((acc, key) => {
                const env = vercelProjectEnvVars.envs.find(
                    (env) => env.key === key,
                ) || {
                    type: "string",
                    value: "",
                    target: "",
                    id: "",
                    createdAt: "",
                    updatedAt: "",
                    createdBy: "",
                    lastEditedByDisplayName: "",
                };

                acc[key] = {
                    type: env.type,
                    value: env.value,
                    target: env.target,
                    id: env.id,
                    createdAt: env.createdAt,
                    updatedAt: env.updatedAt,
                    createdBy: env.createdBy,
                    lastEditedByDisplayName: env.lastEditedByDisplayName,
                };
                return acc;
            }, {});

            return stripeProjectEnvVars;
        } catch (error) {
            this.logger.error(
                `Error getting Stripe project environment variables: ${error.message}`,
            );
            throw error;
        }
    }

    async updateEnvironmentVariables(payload: UpdateEnvironmentVariablesDto) {
        const { project_id, env_vars, env_vars_comment, branch, target } =
            payload;
        this.logger.log({
            message: `${this.serviceName}.updateEnvironmentVariables: Updating environment variables`,
            metadata: {
                project_id,
                env_vars,
                env_vars_comment,
                branch,
                target,
            },
        });

        const envVarsToUpdate = Object.keys(env_vars);

        try {
            const updatedEnvVars = envVarsToUpdate.map((env_key) => {
                if (env_vars[env_key]) {
                    return this.frontendInfraService.addOneEnvironmentVariableToVercelProject(
                        {
                            project_id,
                            environment_variable: {
                                key: env_key,
                                value: env_vars[env_key],
                                type: "plain",
                                target: target,
                                gitBranch: branch,
                                comment: env_vars_comment[env_key] || "",
                            },
                        },
                    );
                }
                return null;
            });

            return updatedEnvVars.filter((env) => env !== null);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
