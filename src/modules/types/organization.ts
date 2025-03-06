export type UserWithRole = {
    id: string;
    email: string;
    name?: string;
    image?: string;
    organization_id?: string;
    organization_ids?: string[];
    customer_id?: string;
    created_at?: Date;
    updated_at?: Date;
    role: string;
};
