import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("file")
export class File {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text", nullable: true })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "varchar", length: 50 })
    type: string;

    @Column({ type: "varchar", length: 255 })
    bucket: string;

    @Column({ type: "text" })
    path: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at: Date;
}
