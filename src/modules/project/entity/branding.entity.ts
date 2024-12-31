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
    logoUrl: string;

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    theme: string;

    @Column({ type: "text", nullable: true })
    perception: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
