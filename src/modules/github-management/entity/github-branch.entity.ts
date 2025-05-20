import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("github_branch")
export class GithubBranch {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "github_repository_id" })
    github_repository_id: string;

    @Column({ type: "text" })
    name: string;

    @Column({ name: "is_active", default: true })
    is_active: boolean;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @Column({ name: "sandbox_id", nullable: true })
    sandbox_id: string;
}
