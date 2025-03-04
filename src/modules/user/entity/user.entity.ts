import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Organization } from "@modules/organization/entity/organization.entity";
// 1 user can have many organizations
@Entity("user")
export class User {
    @PrimaryColumn("uuid")
    id: string;

    @Column({ type: "text", nullable: false })
    email: string;

    @Column({ type: "text", nullable: true })
    name: string;

    @Column({ type: "text", nullable: true })
    image: string;

    @ManyToOne(() => Organization, { nullable: true })
    @JoinColumn({ name: "organization_id" })
    organization: Organization;

    @Column({ type: "uuid", nullable: true })
    organization_id: string;

    @CreateDateColumn({
        type: "timestamp with time zone",
        default: () => "CURRENT_TIMESTAMP",
    })
    created_at: Date;

    @UpdateDateColumn({
        type: "timestamp with time zone",
        default: () => "CURRENT_TIMESTAMP",
    })
    updated_at: Date;

    @Column({ type: "text", nullable: true })
    customer_id: string;

    @Column({ name: "organization_ids", type: "jsonb", default: "[]" })
    organization_ids: string[];
}
