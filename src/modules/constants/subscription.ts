export enum SubscriptionStatus {
    Active = "active",
    Trialing = "trialing",
    Canceled = "canceled",
    NoSubscription = "no_subscription",
    EndedSubscription = "ended_subscription",
}

export const freeTierSubscriptionStatus = [
    SubscriptionStatus.NoSubscription,
    SubscriptionStatus.EndedSubscription,
];

export const FREE_TIER_ITERATIONS_LIMIT = 10;
export const STARTUP_TIER_ITERATIONS_LIMIT = 40;
