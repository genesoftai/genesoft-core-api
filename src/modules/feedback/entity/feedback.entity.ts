import { FeedbackMessage } from "@/modules/types/feedback";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("feedback")
export class Feedback {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id" })
    project_id: string;

    @Column({ name: "is_submit", default: false })
    is_submit: boolean;

    @Column({
        type: "jsonb",
        nullable: true,
        default: () => "ARRAY[]::jsonb",
    })
    messages: FeedbackMessage[];

    @Column({ nullable: true, default: "ongoing" })
    status: string;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
