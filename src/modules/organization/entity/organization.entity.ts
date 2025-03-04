import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

// 1 organization can have many owner, admin, member
@Entity("organization")
export class Organization {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255, nullable: false })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "text", nullable: true })
    image: string;

    @Column({ type: "boolean", default: true })
    is_active: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updated_at: Date;

    @Column({ type: "text", nullable: true })
    customer_id: string;

    @Column({ name: "role", type: "jsonb", default: "{}" })
    role: object;

    @Column({ name: "subscription_id", type: "uuid", nullable: true })
    subscription_id: string;
}
