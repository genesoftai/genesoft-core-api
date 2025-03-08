import { IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class CreateSubscriptionByCheckoutSessionDto {
    @IsNotEmpty()
    @IsString()
    sessionId: string;
}
