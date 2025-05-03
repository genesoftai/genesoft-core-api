import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("conversation")
export class Conversation {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ name: "project_id", nullable: true })
    project_id: string;

    @Column({ name: "page_id", nullable: true })
    page_id: string;

    @Column({ name: "feature_id", nullable: true })
    feature_id: string;

    @Column({ name: "iteration_id", nullable: true })
    iteration_id: string;

    @Column({ type: "varchar", length: 50, default: "active" })
    status: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
