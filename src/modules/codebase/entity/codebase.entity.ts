import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("codebase")
export class Codebase {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "uuid" })
    project_id: string;

    @Column({ type: "text", nullable: true })
    understanding: string;

    @Column({ type: "text", nullable: true })
    created_at: Date;

    @Column({ type: "timestamp", nullable: true })
    updated_at: Date;
}
