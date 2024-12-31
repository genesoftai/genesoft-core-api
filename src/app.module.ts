import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as winston from "winston";
import { OrganizationModule } from "./modules/organization/organization.module";
import { UserModule } from "./modules/user/user.module";
import { ProjectModule } from "./modules/project/project.module";
import {
    WinstonModule,
    utilities as nestWinstonModuleUtilities,
} from "nest-winston";
import { AWSConfigurationModule } from "./modules/configuration/aws";
import { MetadataModule } from "./modules/metadata/metadata.module";

@Module({
    imports: [
        WinstonModule.forRoot({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.ms(),
                        nestWinstonModuleUtilities.format.nestLike("MyApp", {
                            colors: true,
                            prettyPrint: true,
                        }),
                    ),
                }),
            ],
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                url: configService.get("DATABASE_URL"),
                entities: [__dirname + "/**/*.entity{.ts,.js}"],
                synchronize: false, // Set to true only in development
                ssl: {
                    rejectUnauthorized: false, // Needed for some hosting providers
                },
                logging: true,
            }),
            inject: [ConfigService],
        }),
        OrganizationModule,
        UserModule,
        ProjectModule,
        AWSConfigurationModule,
        MetadataModule,
    ],
    controllers: [AppController],
    providers: [AppService, Logger],
})
export class AppModule {}
