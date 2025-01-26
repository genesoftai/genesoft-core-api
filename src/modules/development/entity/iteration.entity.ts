import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("iteration")
export class Iteration {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "text" })
    project_id: string;

    @Column({ type: "text", default: "todo" })
    status: string;

    @Column({ type: "text" })
    type: string;

    @Column({ name: "feedback_id", type: "text", nullable: true })
    feedback_id: string;

    @Column({ name: "working_time", type: "decimal", default: 0.0 })
    working_time: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updated_at: Date;
}
