import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("koyeb_project")
export class KoyebProject {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "uuid" })
    project_id: string;

    @Column({ name: "app_id", type: "text" })
    app_id: string;

    @Column({ name: "service_id", type: "text" })
    service_id: string;

    @Column({ name: "api_key", type: "text" })
    api_key: string;

    @Column({ name: "is_active", default: true, type: "boolean" })
    is_active: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
