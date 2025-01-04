import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

interface Message {
    content: string;
    sender: string;
    timestamp: Date;
}

@Entity("feedback")
export class Feedback {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id" })
    project_id: string;

    @Column({ name: "is_submit", default: false })
    is_submit: boolean;

    @Column({ type: "jsonb", nullable: true })
    messages: Message[];

    @Column({ nullable: true })
    status: string;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
