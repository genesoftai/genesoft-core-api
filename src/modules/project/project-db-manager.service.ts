import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectDb } from "./entity/project-db.entity";
import { Project } from "./entity/project.entity";
import { Client } from "pg";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ProjectDbManagerService {
    private readonly defaultDbUser: string;
    private readonly defaultDbPassword: string;

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
    }

    private async createPostgresClient() {
        return new Client({
            user: this.defaultDbUser,
            password: this.defaultDbPassword,
            host: "localhost",
            port: 5432,
            database: "postgres",
        });
    }

    private generateDbName(projectName: string): string {
        return `project_${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    }

    private generateDbUser(projectName: string): string {
        return `user_${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    }

    private generateDbPassword(): string {
        return Math.random().toString(36).slice(-12);
    }

    async createProjectDatabase(projectId: string): Promise<ProjectDb> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new Error("Project not found");
        }

        const dbName = this.generateDbName(project.name);
        const dbUser = this.generateDbUser(project.name);
        const dbPassword = this.generateDbPassword();

        const client = await this.createPostgresClient();
        try {
            await client.connect();

            // Create user
            await client.query(
                `CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}'`,
            );

            // Create database
            await client.query(`CREATE DATABASE ${dbName}`);

            // Grant privileges
            await client.query(
                `GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}`,
            );

            // Connect to the new database to grant schema privileges
            const dbClient = new Client({
                user: this.defaultDbUser,
                password: this.defaultDbPassword,
                host: "localhost",
                port: 5432,
                database: dbName,
            });
            await dbClient.connect();
            await dbClient.query(`GRANT ALL ON SCHEMA public TO ${dbUser}`);
            await dbClient.end();

            // Store credentials in our database
            const projectDb = this.projectDbRepository.create({
                project_id: projectId,
                db_name: dbName,
                db_user: dbUser,
                db_password: dbPassword,
            });

            return await this.projectDbRepository.save(projectDb);
        } catch (error) {
            // Cleanup in case of error
            try {
                await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
                await client.query(`DROP USER IF EXISTS ${dbUser}`);
            } catch (cleanupError) {
                console.error("Cleanup error:", cleanupError);
            }
            throw error;
        } finally {
            await client.end();
        }
    }

    async deleteProjectDatabase(projectId: string): Promise<void> {
        const projectDb = await this.projectDbRepository.findOne({
            where: { project_id: projectId },
        });

        if (!projectDb) {
            return;
        }

        const client = await this.createPostgresClient();
        try {
            await client.connect();

            // Drop database
            await client.query(`DROP DATABASE IF EXISTS ${projectDb.db_name}`);

            // Drop user
            await client.query(`DROP USER IF EXISTS ${projectDb.db_user}`);

            // Delete from our database
            await this.projectDbRepository.remove(projectDb);
        } finally {
            await client.end();
        }
    }

    async getDatabaseDiskUsage(
        projectId?: string,
    ): Promise<Array<{ database_name: string; size: string }>> {
        const client = await this.createPostgresClient();
        try {
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
                    throw new Error("Project database not found");
                }

                query += ` WHERE d.datname = '${projectDb.db_name}'`;
            }

            query += ` ORDER BY pg_database_size(d.datname) DESC;`;

            const result = await client.query(query);

            // Update disk usage in our database for each project database
            for (const row of result.rows) {
                const projectDb = await this.projectDbRepository.findOne({
                    where: { db_name: row.database_name },
                });

                if (projectDb) {
                    await this.projectDbRepository.update(
                        { id: projectDb.id },
                        { disk_usage: row.size_bytes },
                    );
                }
            }

            // Return only the formatted size for the API response
            return result.rows.map((row) => ({
                database_name: row.database_name,
                size: row.size,
            }));
        } finally {
            await client.end();
        }
    }
}
