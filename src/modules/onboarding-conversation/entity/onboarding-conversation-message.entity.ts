import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("onboarding_conversation_message")
export class OnboardingConversationMessage {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text", nullable: true })
    content: string;

    @Column({ nullable: true, type: "text" })
    sender_id: string;

    @Column({ nullable: true })
    sender_type: string;

    @Column({ nullable: true })
    onboarding_conversation_id: string;

    @Column({ type: "varchar", length: 50, default: "text" })
    message_type: string;

    @Column({ type: "text", array: true, nullable: true })
    file_ids: string[];

    @Column({ type: "text", array: true, nullable: true })
    reference_link_ids: string[];

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
