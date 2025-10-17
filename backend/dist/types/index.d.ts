import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    address: z.ZodString;
    userAgentAddress: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    address: string;
    userAgentAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
}, {
    id: string;
    address: string;
    userAgentAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const SubscriptionStatus: z.ZodEnum<["ACTIVE", "PAUSED", "CANCELLED", "DEFAULTED"]>;
export declare const PaymentAgreementSchema: z.ZodObject<{
    agreementId: z.ZodString;
    user: z.ZodString;
    provider: z.ZodString;
    token: z.ZodString;
    amount: z.ZodString;
    period: z.ZodNumber;
    startDate: z.ZodNumber;
    gracePeriod: z.ZodNumber;
    maxCover: z.ZodString;
    nonce: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    agreementId: string;
    user: string;
    provider: string;
    token: string;
    amount: string;
    period: number;
    startDate: number;
    gracePeriod: number;
    maxCover: string;
    nonce: number;
}, {
    agreementId: string;
    user: string;
    provider: string;
    token: string;
    amount: string;
    period: number;
    startDate: number;
    gracePeriod: number;
    maxCover: string;
    nonce: number;
}>;
export type PaymentAgreement = z.infer<typeof PaymentAgreementSchema>;
export declare const SubscriptionSchema: z.ZodObject<{
    id: z.ZodString;
    agreementId: z.ZodString;
    contractAddress: z.ZodString;
    userId: z.ZodString;
    providerAddress: z.ZodString;
    tokenAddress: z.ZodString;
    amount: z.ZodString;
    period: z.ZodNumber;
    status: z.ZodEnum<["ACTIVE", "PAUSED", "CANCELLED", "DEFAULTED"]>;
    nextPaymentDue: z.ZodDate;
    currentPeriod: z.ZodNumber;
    totalPaid: z.ZodString;
    totalFromPool: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "ACTIVE" | "PAUSED" | "CANCELLED" | "DEFAULTED";
    agreementId: string;
    amount: string;
    period: number;
    contractAddress: string;
    userId: string;
    providerAddress: string;
    tokenAddress: string;
    nextPaymentDue: Date;
    currentPeriod: number;
    totalPaid: string;
    totalFromPool: string;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "ACTIVE" | "PAUSED" | "CANCELLED" | "DEFAULTED";
    agreementId: string;
    amount: string;
    period: number;
    contractAddress: string;
    userId: string;
    providerAddress: string;
    tokenAddress: string;
    nextPaymentDue: Date;
    currentPeriod: number;
    totalPaid: string;
    totalFromPool: string;
}>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export declare const PaymentRecordSchema: z.ZodObject<{
    id: z.ZodString;
    subscriptionId: z.ZodString;
    period: z.ZodNumber;
    amount: z.ZodString;
    dueDate: z.ZodDate;
    paidDate: z.ZodNullable<z.ZodDate>;
    fromPool: z.ZodBoolean;
    payerAddress: z.ZodNullable<z.ZodString>;
    transactionHash: z.ZodNullable<z.ZodString>;
    nftTokenId: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: string;
    period: number;
    subscriptionId: string;
    dueDate: Date;
    paidDate: Date | null;
    fromPool: boolean;
    payerAddress: string | null;
    transactionHash: string | null;
    nftTokenId: number | null;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: string;
    period: number;
    subscriptionId: string;
    dueDate: Date;
    paidDate: Date | null;
    fromPool: boolean;
    payerAddress: string | null;
    transactionHash: string | null;
    nftTokenId: number | null;
}>;
export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;
export declare const ProviderSchema: z.ZodObject<{
    id: z.ZodString;
    address: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    verified: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    verified: boolean;
    description?: string | undefined;
    website?: string | undefined;
}, {
    id: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    verified: boolean;
    description?: string | undefined;
    website?: string | undefined;
}>;
export type Provider = z.infer<typeof ProviderSchema>;
export declare const SubscriptionPlanSchema: z.ZodObject<{
    id: z.ZodString;
    providerId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    tokenAddress: z.ZodString;
    amount: z.ZodString;
    period: z.ZodNumber;
    gracePeriod: z.ZodNumber;
    maxCover: z.ZodString;
    active: z.ZodBoolean;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: string;
    period: number;
    gracePeriod: number;
    maxCover: string;
    tokenAddress: string;
    name: string;
    description: string;
    providerId: string;
    active: boolean;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    amount: string;
    period: number;
    gracePeriod: number;
    maxCover: string;
    tokenAddress: string;
    name: string;
    description: string;
    providerId: string;
    active: boolean;
    metadata?: Record<string, any> | undefined;
}>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export declare const PaymentPointNFTSchema: z.ZodObject<{
    id: z.ZodString;
    tokenId: z.ZodNumber;
    userId: z.ZodString;
    subscriptionId: z.ZodString;
    amount: z.ZodString;
    score: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodString>;
    soulbound: z.ZodBoolean;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    amount: string;
    userId: string;
    subscriptionId: string;
    tokenId: number;
    score: number;
    soulbound: boolean;
    metadata?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    amount: string;
    userId: string;
    subscriptionId: string;
    tokenId: number;
    score: number;
    soulbound: boolean;
    metadata?: string | undefined;
}>;
export type PaymentPointNFT = z.infer<typeof PaymentPointNFTSchema>;
export declare const CreateSubscriptionRequestSchema: z.ZodObject<{
    planId: z.ZodString;
    userSignature: z.ZodString;
    startDate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    planId: string;
    userSignature: string;
    startDate?: number | undefined;
}, {
    planId: string;
    userSignature: string;
    startDate?: number | undefined;
}>;
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;
export declare const GetSubscriptionsQuerySchema: z.ZodObject<{
    userAddress: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "PAUSED", "CANCELLED", "DEFAULTED"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "nextPaymentDue", "amount"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    userAddress: string;
    page: number;
    limit: number;
    sortBy: "createdAt" | "amount" | "nextPaymentDue";
    sortOrder: "asc" | "desc";
    status?: "ACTIVE" | "PAUSED" | "CANCELLED" | "DEFAULTED" | undefined;
}, {
    userAddress: string;
    status?: "ACTIVE" | "PAUSED" | "CANCELLED" | "DEFAULTED" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "amount" | "nextPaymentDue" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type GetSubscriptionsQuery = z.infer<typeof GetSubscriptionsQuerySchema>;
export declare const PaymentQuoteRequestSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
    amount: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subscriptionId: string;
    amount?: string | undefined;
}, {
    subscriptionId: string;
    amount?: string | undefined;
}>;
export type PaymentQuoteRequest = z.infer<typeof PaymentQuoteRequestSchema>;
export declare const PaymentQuoteResponseSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
    amount: z.ZodString;
    gasEstimate: z.ZodString;
    gasCost: z.ZodString;
    totalCost: z.ZodString;
    canSponsor: z.ZodBoolean;
    expiresAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: string;
    subscriptionId: string;
    gasEstimate: string;
    gasCost: string;
    totalCost: string;
    canSponsor: boolean;
    expiresAt: number;
}, {
    amount: string;
    subscriptionId: string;
    gasEstimate: string;
    gasCost: string;
    totalCost: string;
    canSponsor: boolean;
    expiresAt: number;
}>;
export type PaymentQuoteResponse = z.infer<typeof PaymentQuoteResponseSchema>;
export declare const WebSocketMessageSchema: z.ZodObject<{
    type: z.ZodEnum<["subscription_update", "payment_due", "payment_completed", "status_change"]>;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "subscription_update" | "payment_due" | "payment_completed" | "status_change";
    data: Record<string, any>;
    timestamp: number;
}, {
    type: "subscription_update" | "payment_due" | "payment_completed" | "status_change";
    data: Record<string, any>;
    timestamp: number;
}>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export declare const APIErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    }>;
    timestamp: z.ZodNumber;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    timestamp: number;
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
}, {
    path: string;
    timestamp: number;
    error: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
    };
}>;
export type APIError = z.infer<typeof APIErrorSchema>;
export declare const AnalyticsQuerySchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
    groupBy: z.ZodDefault<z.ZodEnum<["day", "week", "month"]>>;
    metrics: z.ZodDefault<z.ZodArray<z.ZodEnum<["subscriptions", "payments", "volume", "users"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
    groupBy: "day" | "week" | "month";
    metrics: ("subscriptions" | "payments" | "volume" | "users")[];
}, {
    startDate: string;
    endDate: string;
    groupBy?: "day" | "week" | "month" | undefined;
    metrics?: ("subscriptions" | "payments" | "volume" | "users")[] | undefined;
}>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export declare const TransactionReceiptSchema: z.ZodObject<{
    transactionHash: z.ZodString;
    blockNumber: z.ZodNumber;
    gasUsed: z.ZodString;
    status: z.ZodNumber;
    logs: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    status: number;
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    logs: any[];
}, {
    status: number;
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
    logs: any[];
}>;
export type TransactionReceipt = z.infer<typeof TransactionReceiptSchema>;
export declare const RateLimitConfigSchema: z.ZodObject<{
    max: z.ZodNumber;
    timeWindow: z.ZodNumber;
    skipSuccessfulRequests: z.ZodDefault<z.ZodBoolean>;
    skipFailedRequests: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    max: number;
    timeWindow: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}, {
    max: number;
    timeWindow: number;
    skipSuccessfulRequests?: boolean | undefined;
    skipFailedRequests?: boolean | undefined;
}>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export declare const JWTPayloadSchema: z.ZodObject<{
    userId: z.ZodString;
    address: z.ZodString;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    address: string;
    userId: string;
    iat: number;
    exp: number;
}, {
    address: string;
    userId: string;
    iat: number;
    exp: number;
}>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
export declare const PaginatedResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    data: T["_input"][];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const HealthCheckSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "unhealthy"]>;
    timestamp: z.ZodNumber;
    version: z.ZodString;
    uptime: z.ZodNumber;
    checks: z.ZodObject<{
        database: z.ZodBoolean;
        blockchain: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        database: boolean;
        blockchain: boolean;
    }, {
        database: boolean;
        blockchain: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "unhealthy";
    timestamp: number;
    version: string;
    uptime: number;
    checks: {
        database: boolean;
        blockchain: boolean;
    };
}, {
    status: "healthy" | "unhealthy";
    timestamp: number;
    version: string;
    uptime: number;
    checks: {
        database: boolean;
        blockchain: boolean;
    };
}>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
//# sourceMappingURL=index.d.ts.map