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

    @Column({ nullable: true })
    type: string;

    @Column({ name: "repo_id" })
    repo_id: string;

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
}
