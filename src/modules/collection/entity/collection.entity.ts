import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

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

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
