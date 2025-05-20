import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as bodyParser from "body-parser";
import { CloudWatchLogger } from "./modules/cloudwatch-logger.service";
const port = parseInt(process.env.PORT, 10) || 8000;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new CloudWatchLogger(),
    });
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());

    const config = new DocumentBuilder()
        .setTitle("Genesoft Core API service")
        .setDescription(
            "Genesoft Core API service is the service for Genesoft Core functionalities.",
        )
        .setVersion("0.0.1")
        .addTag("Genesoft Core API service")
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/api-docs", app, document);

    app.setGlobalPrefix("api", {
        exclude: [{ path: "health", method: RequestMethod.GET }],
    });

    // Use body-parser to parse Stripe webhooks
    app.use(
        "/api/stripe/webhook",
        bodyParser.raw({ type: "application/json" }),
    );

    await app.listen(port);
    console.log(`Genesoft Core API service start listening on port ${port}`);
}

bootstrap();
