import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { Project } from "@/modules/project/entity/project.entity";

@Entity("project_db")
export class ProjectDb {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "uuid" })
    project_id: string;

    @OneToOne(() => Project)
    @JoinColumn({ name: "project_id" })
    project: Project;

    @Column({ name: "db_name" })
    db_name: string;

    @Column({ name: "db_user" })
    db_user: string;

    @Column({ name: "db_password" })
    db_password: string;

    @Column({ name: "disk_usage", type: "bigint", nullable: true })
    disk_usage: number;

    @Column({ name: "expired_at", type: "timestamp", nullable: true })
    expired_at: Date;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
