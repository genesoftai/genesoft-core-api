import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("business_logic_ai_agent_request")
export class BusinessLogicAIAgentRequest {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "project_id", type: "uuid" })
    projectId: string;

    @Column({ name: "request", type: "text", nullable: true })
    request: string;

    @Column({ name: "data", type: "text", nullable: true })
    data: string;

    @Column({ name: "response", type: "text", nullable: true })
    response: string;

    @Column({ name: "method", type: "varchar", length: 10 })
    method: string;

    @Column({ name: "endpoint", type: "varchar", length: 255 })
    endpoint: string;

    @Column({ name: "status_code", type: "int", nullable: true })
    statusCode: number;

    @Column({ name: "error_message", type: "text", nullable: true })
    errorMessage: string;

    @Column({ name: "input", type: "text", nullable: true })
    input: string;

    @Column({ name: "ai_agent_response", type: "text", nullable: true })
    aiAgentResponse: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at: Date;
}
