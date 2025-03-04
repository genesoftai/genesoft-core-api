import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("subscription")
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "organization_id" })
    organization_id: string;

    @Column({ name: "cancel_at", nullable: true })
    cancel_at: Date;

    @Column({ name: "cancel_at_period_end", nullable: true })
    cancel_at_period_end: boolean;

    @Column({ name: "canceled_at", nullable: true })
    canceled_at: Date;

    @CreateDateColumn({ name: "created" })
    created: Date;

    @Column({ name: "current_period_end" })
    current_period_end: Date;

    @Column({ name: "current_period_start" })
    current_period_start: Date;

    @Column({ name: "ended_at", nullable: true })
    ended_at: Date;

    @Column({ name: "metadata", type: "jsonb", nullable: true })
    metadata: any;

    @Column({ name: "price_id", nullable: true })
    price_id: string;

    @Column({ nullable: true })
    quantity: number;

    @Column({ nullable: true })
    status: string;

    @Column({ name: "trial_end", nullable: true })
    trial_end: Date;

    @Column({ name: "trial_start", nullable: true })
    trial_start: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;

    @Column({ name: "tier", type: "text", nullable: true })
    tier: string;
}
