import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("feature")
export class Feature {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id" })
    project_id: string;

    @Column()
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ name: "file_ids", type: "jsonb", default: "[]" })
    file_ids: string[];

    @Column({ name: "reference_link_ids", type: "jsonb", default: "[]" })
    reference_link_ids: string[];

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
