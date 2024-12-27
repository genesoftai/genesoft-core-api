import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

const port = parseInt(process.env.PORT, 10) || 8000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Organization API')
    .setDescription(
      'Organization API is the service for organization management functionalities.',
    )
    .setVersion('0.0.1')
    .addTag('Organization API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/api-docs', app, document);

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // Use body-parser to parse Stripe webhooks
  app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  await app.listen(port);
  console.log(`Organization API start listening on port ${port}`);
}

bootstrap();
