import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("figma_file")
export class FigmaFile {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "text" })
    project_id: string;

    @Column({ name: "figma_file_key", type: "text" })
    figma_file_key: string;

    @Column({ name: "figma_file_url", type: "text" })
    figma_file_url: string;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
