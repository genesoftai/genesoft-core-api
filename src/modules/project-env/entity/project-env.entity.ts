import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "../../project/entity/project.entity";

@Entity("project_envs")
export class ProjectEnv {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    key: string;

    @Column({
        name: "encrypted_value",
        type: "text",
    })
    encryptedValue: string;

    @Column({
        name: "is_secret",
        default: false,
    })
    isSecret: boolean;

    @Column({
        name: "created_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt: Date;

    @Column({
        nullable: true,
        name: "updated_at",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;

    @ManyToOne(() => Project, (project) => project.envs)
    @JoinColumn({ name: "project_id" })
    project: Project;

    @Column({ name: "project_id" })
    projectId: string;
}
