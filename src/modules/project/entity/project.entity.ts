import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from "typeorm";
import { ProjectEnv } from "./project-env.entity";

@Entity("project")
export class Project {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "organization_id", type: "uuid" })
    organization_id: string;

    @Column()
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "text", nullable: true })
    purpose: string;

    @Column({ name: "target_audience", type: "text", nullable: true })
    target_audience: string;

    @Column({ name: "branding_id", type: "uuid", nullable: true })
    branding_id: string;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @Column({ name: "sandbox_id", type: "text", nullable: true })
    sandbox_id: string;

    @Column({ name: "project_template_type", type: "text", nullable: true })
    project_template_type: string;

    @Column({ name: "backend_requirements", type: "text", nullable: true })
    backend_requirements: string;

    @OneToMany(() => ProjectEnv, (env) => env.project)
    envs: ProjectEnv[];
}
