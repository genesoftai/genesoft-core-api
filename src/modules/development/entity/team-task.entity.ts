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

@Entity("team_task")
export class TeamTask {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "iteration_task_id", type: "uuid" })
    iteration_task_id: string;

    @ManyToOne(() => IterationTask, { onDelete: "CASCADE" })
    @JoinColumn({ name: "iteration_task_id" })
    iteration_task: IterationTask;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "text" })
    team: string;

    @Column({ type: "text", default: "todo" })
    status: string;

    @Column({ type: "text", nullable: true })
    remark: string;

    @Column({ name: "working_time", type: "decimal", default: 0.0 })
    working_time: number;

    @Column({ name: "tool_usage", type: "jsonb", default: "{}" })
    tool_usage: Record<string, any>;

    @Column({ name: "llm_usage", type: "jsonb", default: "{}" })
    llm_usage: Record<string, any>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updated_at: Date;
}
