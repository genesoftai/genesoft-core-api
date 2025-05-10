import { ConsoleLogger } from "@nestjs/common";
import {
    CloudWatchLogsClient,
    CreateLogGroupCommand,
    CreateLogStreamCommand,
    PutLogEventsCommand,
    DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

export class CloudWatchLogger extends ConsoleLogger {
    private client: CloudWatchLogsClient;

    private logGroupName =
        process.env.NODE_ENV === "production"
            ? "prod-nestjs-app-log-group"
            : "nestjs-app-log-group";

    private logStreamName =
        process.env.NODE_ENV === "production"
            ? "prod-nestjs-log-stream" + "-" + Date.now()
            : "nestjs-log-stream" + "-" + Date.now();

    private sequenceToken: string | undefined;
    private isReady = false;

    constructor() {
        super();
        if (process.env.NODE_ENV === "production" || process.env.CLOUDWATCH_LOG == "1") {
            this.client = new CloudWatchLogsClient({
                region: "ap-southeast-1",
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
            this.setup();
        } else {
            this.isReady = true;
        }
    }

    private async setup() {
        try {
            await this.client.send(
                new CreateLogGroupCommand({ logGroupName: this.logGroupName }),
            );
        } catch (e: any) {
            if (e.name !== "ResourceAlreadyExistsException") throw e;
        }

        try {
            await this.client.send(
                new CreateLogStreamCommand({
                    logGroupName: this.logGroupName,
                    logStreamName: this.logStreamName,
                }),
            );
        } catch (e: any) {
            if (e.name !== "ResourceAlreadyExistsException") throw e;
        }

        const streams = await this.client.send(
            new DescribeLogStreamsCommand({
                logGroupName: this.logGroupName,
                logStreamNamePrefix: this.logStreamName,
            }),
        );

        this.sequenceToken = streams.logStreams?.[0]?.uploadSequenceToken;
        this.isReady = true;
    }

    private async sendToCloudWatch(message: string) {
        if (!this.isReady || this.client == null) {
            return;
        }
        const now = Date.now();
        const input = {
            logGroupName: this.logGroupName,
            logStreamName: this.logStreamName,
            logEvents: [{ message, timestamp: now }],
            sequenceToken: this.sequenceToken,
        };

        const result = await this.client.send(new PutLogEventsCommand(input));
        this.sequenceToken = result.nextSequenceToken;
    }

    async log(message: any, ...optionalParams: any[]) {
        super.log(message);
        await this.sendToCloudWatch(
            `[LOG] ${message} ${JSON.stringify(optionalParams) ?? ""}`,
        );
    }

    async error(message: any, ...optionalParams: any[]) {
        super.error(message);
        await this.sendToCloudWatch(
            `[ERROR] ${message} ${JSON.stringify(optionalParams) ?? ""}`,
        );
    }

    async warn(message: any, ...optionalParams: any[]) {
        super.warn(message, optionalParams);
        await this.sendToCloudWatch(`[WARN] ${message}`);
    }

    async debug(message: any, ...optionalParams: any[]) {
        super.debug(message, optionalParams);
        await this.sendToCloudWatch(`[DEBUG] ${message}`);
    }

    async verbose(message: any, ...optionalParams: any[]) {
        super.verbose(message, optionalParams);
        await this.sendToCloudWatch(`[VERBOSE] ${message}`);
    }

    tryParse(message: any) {
        // if message is a string, return i
        // if json Json.stringify
        if (typeof message === "string") {
            return message;
        }
        try {
            return JSON.stringify(message);
        } catch (e) {
            return String(message);
        }
    }
}
