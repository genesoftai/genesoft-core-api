import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Project } from "../../project/entity/project.entity";

@Entity("collection")
export class Collection {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "name", type: "text" })
    name: string;

    @Column({ name: "description", type: "text", nullable: true })
    description: string;

    @Column({ name: "is_active", default: true, type: "boolean" })
    is_active: boolean;

    @Column({ name: "web_project_id", type: "text" })
    web_project_id: string;

    @Column({
        name: "backend_service_project_ids",
        type: "text",
        array: true,
        nullable: true,
    })
    backend_service_project_ids: string[];

    @Column({ name: "organization_id", type: "text" })
    organization_id: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "web_project_id" })
    webProject: Project;

    @ManyToOne(() => Project)
    @JoinColumn({ name: "backend_service_project_ids" })
    backendServiceProjects: Project[];

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
