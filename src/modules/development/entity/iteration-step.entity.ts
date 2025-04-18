import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { IterationTask } from "./iteration-task.entity";

@Entity("iteration_step")
export class IterationStep {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "iteration_task_id", type: "uuid" })
    iteration_task_id: string;

    @ManyToOne(() => IterationTask, { onDelete: "CASCADE" })
    @JoinColumn({ name: "iteration_task_id" })
    iteration_task: IterationTask;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "text" })
    description: string;

    @Column({ type: "text", default: "todo" })
    status: string;

    @Column({ type: "text", nullable: true })
    remark: string;

    @Column({ name: "tool" })
    tool: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updated_at: Date;
}
