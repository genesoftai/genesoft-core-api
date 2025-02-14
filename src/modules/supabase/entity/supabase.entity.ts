import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("supabase")
export class Supabase {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "uuid" })
    project_id: string;

    @Column({ name: "supabase_project_id", type: "text" })
    supabase_project_id: string;

    @Column({ name: "url", type: "text" })
    url: string;

    @Column({ name: "db_password", type: "text" })
    db_password: string;

    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updated_at: Date;
}
