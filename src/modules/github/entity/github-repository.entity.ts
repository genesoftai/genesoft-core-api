import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("github_repository")
export class GithubRepository {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id" })
    project_id: string;

    @Column({ name: "type", nullable: true })
    type: string;

    @Column({ name: "repo_id" })
    repo_id: string;

    @Column({ name: "installation_id" })
    installation_id: number;

    @Column()
    owner: string;

    @Column({ type: "text" })
    name: string;

    @Column({ name: "full_name", type: "text" })
    full_name: string;

    @Column({ name: "is_active", default: true })
    is_active: boolean;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @Column({ name: "managed_by", type: "text", nullable: true })
    managed_by: string;

    @Column({ name: "development_branch", type: "text", nullable: true })
    development_branch: string;

    @Column({ name: "production_branch", type: "text", nullable: true })
    production_branch: string;
}
