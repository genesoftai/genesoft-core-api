import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
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
import { GithubConfigurationModule } from "./modules/configuration/github";
import { AuthModule } from "./modules/auth/auth.module";
import { AppConfigurationModule } from "./modules/configuration/app/app.module";
import { AppConfigurationService } from "./modules/configuration/app/app.service";

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
            imports: [ConfigModule, AppConfigurationModule],
            inject: [AppConfigurationService],
            useFactory: (appConfigurationService: AppConfigurationService) => ({
                type: "postgres",
                url: appConfigurationService.databaseUrl,
                entities: ["dist/**/*.entity{.ts,.js}"],
                synchronize: false,
                host: appConfigurationService.databaseHost,
                port: appConfigurationService.databasePort,
                username: appConfigurationService.databaseUser,
                password: appConfigurationService.databasePassword,
                database: appConfigurationService.databaseName,
            }),
        }),
        OrganizationModule,
        UserModule,
        ProjectModule,
        AWSConfigurationModule,
        MetadataModule,
        GithubConfigurationModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService, Logger],
})
export class AppModule {}
