import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectDb } from "./entity/project-db.entity";
import { Project } from "./entity/project.entity";
import { Client } from "pg";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class ProjectDbManagerService {
    private readonly defaultDbUser: string;
    private readonly defaultDbPassword: string;
    private readonly defaultDbHost: string;
    private readonly encryptionKey: string;
    private readonly logger = new Logger(ProjectDbManagerService.name);

    constructor(
        @InjectRepository(ProjectDb)
        private projectDbRepository: Repository<ProjectDb>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        private configService: ConfigService,
    ) {
        this.defaultDbUser = this.configService.get<string>("PROJECT_DB_USER");
        this.defaultDbPassword = this.configService.get<string>(
            "PROJECT_DB_PASSWORD",
        );
        this.defaultDbHost = this.configService.get<string>("PROJECT_DB_HOST");
        this.encryptionKey = this.configService.get<string>("PROJECT_DB_KEY");

        if (!this.encryptionKey) {
            this.logger.error("PROJECT_DB_KEY environment variable is not set");
            throw new Error("PROJECT_DB_KEY environment variable is required");
        }
    }

    private encryptPassword(password: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            "aes-256-gcm",
            Buffer.from(this.encryptionKey, "hex"),
            iv,
        );
        let encrypted = cipher.update(password, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag();
        return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
    }

    private decryptPassword(encryptedPassword: string): string {
        const [ivHex, encrypted, authTagHex] = encryptedPassword.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            Buffer.from(this.encryptionKey, "hex"),
            iv,
        );
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }

    private async createPostgresClient() {
        this.logger.log("Creating PostgreSQL client connection");
        return new Client({
            user: this.defaultDbUser,
            password: this.defaultDbPassword,
            host: this.defaultDbHost,
            port: 5432,
            database: "postgres",
            ssl: { rejectUnauthorized: false },
        });
    }

    private generateDbName(projectName: string): string {
        const dbName = `project_${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        this.logger.log(`Generated database name: ${dbName}`);
        return dbName;
    }

    private generateDbUser(projectName: string): string {
        const dbUser = `user_${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        this.logger.log(`Generated database user: ${dbUser}`);
        return dbUser;
    }

    private generateDbPassword(): string {
        const dbPassword = Math.random().toString(36).slice(-12);
        this.logger.log("Generated database password");
        const encryptedPassword = this.encryptPassword(dbPassword);
        this.logger.log("Encrypted database password");
        return encryptedPassword;
    }

    async createProjectDatabase(projectId: string): Promise<ProjectDb> {
        this.logger.log(`Creating database for project: ${projectId}`);

        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            this.logger.error(`Project not found: ${projectId}`);
            throw new Error("Project not found");
        }

        // Check if project already has a database
        const existingDb = await this.projectDbRepository.findOne({
            where: { project_id: projectId },
        });
        if (existingDb) {
            throw new Error("Project already has a database");
        }

        const dbName = this.generateDbName(project.name);
        const dbUser = this.generateDbUser(project.name);
        const encryptedDbPassword = this.generateDbPassword();
        const dbPassword = this.decryptPassword(encryptedDbPassword);

        const client = await this.createPostgresClient();
        try {
            this.logger.log(`Connecting to PostgreSQL server`);
            await client.connect();

            // Create user with decrypted password
            this.logger.log(`Creating database user: ${dbUser}`);
            await client.query(
                `CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}'`,
            );

            // Create database
            this.logger.log(`Creating database: ${dbName}`);
            await client.query(`CREATE DATABASE ${dbName}`);

            // Grant privileges
            this.logger.log(`Granting privileges to user: ${dbUser}`);
            await client.query(
                `GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}`,
            );

            // Connect to the new database to grant schema privileges
            this.logger.log(
                `Connecting to new database to grant schema privileges`,
            );
            const dbClient = new Client({
                user: this.defaultDbUser,
                password: this.defaultDbPassword,
                host: this.defaultDbHost,
                port: 5432,
                database: dbName,
                ssl: { rejectUnauthorized: false },
            });
            await dbClient.connect();
            await dbClient.query(`GRANT ALL ON SCHEMA public TO ${dbUser}`);
            await dbClient.end();
            this.logger.log(`Schema privileges granted to user: ${dbUser}`);

            // Store encrypted credentials in our database
            this.logger.log(
                `Storing encrypted database credentials in our database`,
            );
            const projectDb = this.projectDbRepository.create({
                project_id: projectId,
                db_name: dbName,
                db_user: dbUser,
                db_password: encryptedDbPassword,
            });

            const savedProjectDb =
                await this.projectDbRepository.save(projectDb);
            this.logger.log(
                `Database created successfully for project: ${projectId}`,
            );
            return savedProjectDb;
        } catch (error) {
            this.logger.error(`Error creating database: ${error.message}`);
            // Cleanup in case of error
            try {
                this.logger.log(
                    `Cleaning up after error: dropping database and user`,
                );
                await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
                await client.query(`DROP USER IF EXISTS ${dbUser}`);
            } catch (cleanupError) {
                this.logger.error(`Cleanup error: ${cleanupError.message}`);
                console.error("Cleanup error:", cleanupError);
            }
            throw error;
        } finally {
            await client.end();
            this.logger.log(`PostgreSQL client connection closed`);
        }
    }

    async deleteProjectDatabase(projectId: string): Promise<void> {
        this.logger.log(`Deleting database for project: ${projectId}`);

        const projectDb = await this.projectDbRepository.findOne({
            where: { project_id: projectId },
        });

        if (!projectDb) {
            this.logger.warn(`No database found for project: ${projectId}`);
            return;
        }

        const client = await this.createPostgresClient();
        try {
            this.logger.log(`Connecting to PostgreSQL server`);
            await client.connect();

            // Drop database
            this.logger.log(`Dropping database: ${projectDb.db_name}`);
            await client.query(`DROP DATABASE IF EXISTS ${projectDb.db_name}`);

            // Drop user
            this.logger.log(`Dropping user: ${projectDb.db_user}`);
            await client.query(`DROP USER IF EXISTS ${projectDb.db_user}`);

            // Delete from our database
            this.logger.log(`Removing database record from our database`);
            await this.projectDbRepository.remove(projectDb);
            this.logger.log(
                `Database deleted successfully for project: ${projectId}`,
            );
        } catch (error) {
            this.logger.error(`Error deleting database: ${error.message}`);
            throw error;
        } finally {
            await client.end();
            this.logger.log(`PostgreSQL client connection closed`);
        }
    }

    async getDatabaseDiskUsage(
        projectId?: string,
    ): Promise<Array<{ database_name: string; size: string }>> {
        this.logger.log(
            `Getting database disk usage${projectId ? ` for project: ${projectId}` : " for all projects"}`,
        );

        const client = await this.createPostgresClient();
        try {
            this.logger.log(`Connecting to PostgreSQL server`);
            await client.connect();

            let query = `
                SELECT
                    d.datname AS database_name,
                    pg_size_pretty(pg_database_size(d.datname)) AS size,
                    pg_database_size(d.datname) AS size_bytes
                FROM
                    pg_database d
            `;

            // If projectId is provided, filter for that specific project's database
            if (projectId) {
                const projectDb = await this.projectDbRepository.findOne({
                    where: { project_id: projectId },
                });

                if (!projectDb) {
                    this.logger.error(
                        `Project database not found: ${projectId}`,
                    );
                    throw new Error("Project database not found");
                }

                this.logger.log(`Filtering for database: ${projectDb.db_name}`);
                query += ` WHERE d.datname = '${projectDb.db_name}'`;
            }

            query += ` ORDER BY pg_database_size(d.datname) DESC;`;

            this.logger.log(`Executing query to get database sizes`);
            const result = await client.query(query);

            // Update disk usage in our database for each project database
            this.logger.log(`Updating disk usage in our database`);
            for (const row of result.rows) {
                const projectDb = await this.projectDbRepository.findOne({
                    where: { db_name: row.database_name },
                });

                if (projectDb) {
                    this.logger.log(
                        `Updating disk usage for database: ${row.database_name}`,
                    );
                    await this.projectDbRepository.update(
                        { id: projectDb.id },
                        { disk_usage: row.size_bytes },
                    );
                }
            }

            this.logger.log(`Database disk usage retrieved successfully`);
            // Return only the formatted size for the API response
            return result.rows.map((row) => ({
                database_name: row.database_name,
                size: row.size,
            }));
        } catch (error) {
            this.logger.error(
                `Error getting database disk usage: ${error.message}`,
            );
            throw error;
        } finally {
            await client.end();
            this.logger.log(`PostgreSQL client connection closed`);
        }
    }

    async getProjectDatabaseCredentials(projectId: string): Promise<{
        db_name: string;
        db_user: string;
        db_password: string;
    }> {
        this.logger.log(
            `Getting database credentials for project: ${projectId}`,
        );

        const projectDb = await this.projectDbRepository.findOne({
            where: { project_id: projectId },
        });

        if (!projectDb) {
            this.logger.error(`Database for project ${projectId} not found`);
            throw new NotFoundException(
                `Database for project ${projectId} not found`,
            );
        }

        // Decrypt the password before returning
        const decryptedPassword = this.decryptPassword(projectDb.db_password);

        this.logger.log(
            `Database credentials retrieved successfully for project: ${projectId}`,
        );
        return {
            db_name: projectDb.db_name,
            db_user: projectDb.db_user,
            db_password: decryptedPassword,
        };
    }

    async getProjectDatabaseInfo(projectId: string): Promise<{
        db_name: string;
        disk_usage: number;
        expired_at: Date | null;
        created_at: Date;
        updated_at: Date;
    }> {
        this.logger.log(`Getting database info for project: ${projectId}`);

        const projectDb = await this.projectDbRepository.findOne({
            where: { project_id: projectId },
        });

        if (!projectDb) {
            this.logger.error(`Database for project ${projectId} not found`);
            throw new NotFoundException(
                `Database for project ${projectId} not found`,
            );
        }

        this.logger.log(
            `Database info retrieved successfully for project: ${projectId}`,
        );
        return {
            db_name: projectDb.db_name,
            disk_usage: projectDb.disk_usage,
            expired_at: projectDb.expired_at,
            created_at: projectDb.created_at,
            updated_at: projectDb.updated_at,
        };
    }
}
