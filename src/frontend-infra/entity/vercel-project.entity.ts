import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("vercel_project")
export class VercelProject {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "text" })
    project_id: string;

    @Column({ name: "vercel_project_id", type: "text" })
    vercel_project_id: string;

    @Column({ name: "vercel_project_name", type: "text" })
    vercel_project_name: string;

    @Column({ name: "is_active", default: true, type: "boolean" })
    is_active: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
