import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("onboarding_conversation")
export class OnboardingConversation {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    project_id: string;

    @Column({ nullable: true })
    collection_id: string;

    @Column({ type: "varchar", length: 50, default: "active" })
    status: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
