import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project.entity";

@Entity("project_envs")
export class ProjectEnv {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    key: string;

    @Column({ type: "text" })
    encryptedValue: string;

    @Column({ default: false })
    isSecret: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @Column({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;

    @ManyToOne(() => Project, (project) => project.envs)
    project: Project;

    @Column()
    projectId: string;
}
