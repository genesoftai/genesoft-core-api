import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("repository_build")
export class RepositoryBuild {
    @ApiProperty({
        description: "The unique identifier of the repository build",
    })
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ApiProperty({
        description: "The project ID associated with this build",
    })
    @Column()
    project_id: string;

    @ApiProperty({
        description: "The iteration ID",
    })
    @Column()
    iteration_id: string;

    @ApiProperty({
        description: "The repository type: web or api",
    })
    @Column()
    type: string;

    @ApiProperty({
        description: "The build status (pending, in_progress, success, failed)",
    })
    @Column()
    status: string;

    @ApiProperty({
        description: "The error logs if build failed",
    })
    @Column({ nullable: true })
    error_logs: string;

    @ApiProperty({
        description: "Number of fix attempts made",
    })
    @Column({ default: 0 })
    fix_attempts: number;

    @ApiProperty({
        description: "Whether a fix has been triggered",
    })
    @Column({ default: false })
    fix_triggered: boolean;

    @ApiProperty({
        description: "Last fix attempt timestamp",
    })
    @Column({ nullable: true })
    last_fix_attempt: Date;

    @ApiProperty({
        description: "Creation timestamp",
    })
    @CreateDateColumn()
    created_at: Date;

    @ApiProperty({
        description: "Last update timestamp",
    })
    @UpdateDateColumn()
    updated_at: Date;
}
