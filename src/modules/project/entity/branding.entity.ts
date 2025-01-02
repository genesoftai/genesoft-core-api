import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("branding")
export class Branding {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id" })
    projectId: string;

    @Column({ name: "logo_url", type: "text", nullable: true })
    logo_url: string;

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    theme: string;

    @Column({ type: "text", nullable: true })
    perception: string;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
