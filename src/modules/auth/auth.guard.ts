import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    LoggerService,
} from "@nestjs/common";
import { AppConfigurationService } from "../configuration/app";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly serviceName: string;

    constructor(
        private appConfigurationService: AppConfigurationService,
        @Inject(Logger) private readonly logger: LoggerService,
    ) {
        this.serviceName = AuthGuard.name;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        // we use a hardcoded string to validate the user for sake of simplicity
        if (request.headers["authorization"]) {
            console.log(request.headers["authorization"]);
            try {
                const apiKey = request.headers["authorization"].split(" ")[1];
                return apiKey === this.appConfigurationService.genesoftApiKey;
            } catch (error) {
                this.logger.error({
                    message: `${this.serviceName}.canActivate: Error on authenticate request with Genesoft API Key`,
                    metadata: { error },
                });
                return false;
            }
        } else {
            return false;
        }
    }
}
