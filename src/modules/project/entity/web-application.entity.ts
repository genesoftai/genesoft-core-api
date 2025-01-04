import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("web_application")
export class WebApplication {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id" })
    project_id: string;

    @Column({ default: "production" })
    environment: string;

    @Column({ default: "running" })
    status: string;

    @Column({ type: "text", nullable: true })
    url: string;

    @Column({ name: "third_party_services", type: "jsonb", nullable: true })
    third_party_services: any;

    @Column({ type: "text", nullable: true })
    image: string;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
