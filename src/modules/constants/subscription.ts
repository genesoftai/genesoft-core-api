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
