"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckSchema = exports.PaginatedResponseSchema = exports.PaginationSchema = exports.JWTPayloadSchema = exports.RateLimitConfigSchema = exports.TransactionReceiptSchema = exports.AnalyticsQuerySchema = exports.APIErrorSchema = exports.WebSocketMessageSchema = exports.PaymentQuoteResponseSchema = exports.PaymentQuoteRequestSchema = exports.GetSubscriptionsQuerySchema = exports.CreateSubscriptionRequestSchema = exports.PaymentPointNFTSchema = exports.SubscriptionPlanSchema = exports.ProviderSchema = exports.PaymentRecordSchema = exports.SubscriptionSchema = exports.PaymentAgreementSchema = exports.SubscriptionStatus = exports.UserSchema = void 0;
const zod_1 = require("zod");
// User Types
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    userAgentAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Subscription Types
exports.SubscriptionStatus = zod_1.z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'DEFAULTED']);
exports.PaymentAgreementSchema = zod_1.z.object({
    agreementId: zod_1.z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    user: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    provider: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    token: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: zod_1.z.string(),
    period: zod_1.z.number().positive(),
    startDate: zod_1.z.number().positive(),
    gracePeriod: zod_1.z.number().positive(),
    maxCover: zod_1.z.string(),
    nonce: zod_1.z.number().nonnegative(),
});
exports.SubscriptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    agreementId: zod_1.z.string(),
    contractAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    userId: zod_1.z.string(),
    providerAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    tokenAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: zod_1.z.string(),
    period: zod_1.z.number(),
    status: exports.SubscriptionStatus,
    nextPaymentDue: zod_1.z.date(),
    currentPeriod: zod_1.z.number(),
    totalPaid: zod_1.z.string(),
    totalFromPool: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Payment Types
exports.PaymentRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    subscriptionId: zod_1.z.string(),
    period: zod_1.z.number(),
    amount: zod_1.z.string(),
    dueDate: zod_1.z.date(),
    paidDate: zod_1.z.date().nullable(),
    fromPool: zod_1.z.boolean(),
    payerAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable(),
    transactionHash: zod_1.z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),
    nftTokenId: zod_1.z.number().nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Provider Types
exports.ProviderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    verified: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// Subscription Plan Types
exports.SubscriptionPlanSchema = zod_1.z.object({
    id: zod_1.z.string(),
    providerId: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    tokenAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: zod_1.z.string(),
    period: zod_1.z.number(),
    gracePeriod: zod_1.z.number(),
    maxCover: zod_1.z.string(),
    active: zod_1.z.boolean(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
// NFT Types
exports.PaymentPointNFTSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tokenId: zod_1.z.number(),
    userId: zod_1.z.string(),
    subscriptionId: zod_1.z.string(),
    amount: zod_1.z.string(),
    score: zod_1.z.number(),
    metadata: zod_1.z.string().optional(),
    soulbound: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
});
// API Request/Response Types
exports.CreateSubscriptionRequestSchema = zod_1.z.object({
    planId: zod_1.z.string(),
    userSignature: zod_1.z.string(),
    startDate: zod_1.z.number().optional(),
});
exports.GetSubscriptionsQuerySchema = zod_1.z.object({
    userAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    status: exports.SubscriptionStatus.optional(),
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(20),
    sortBy: zod_1.z.enum(['createdAt', 'nextPaymentDue', 'amount']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.PaymentQuoteRequestSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string(),
    amount: zod_1.z.string().optional(),
});
exports.PaymentQuoteResponseSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string(),
    amount: zod_1.z.string(),
    gasEstimate: zod_1.z.string(),
    gasCost: zod_1.z.string(),
    totalCost: zod_1.z.string(),
    canSponsor: zod_1.z.boolean(),
    expiresAt: zod_1.z.number(),
});
// WebSocket Types
exports.WebSocketMessageSchema = zod_1.z.object({
    type: zod_1.z.enum(['subscription_update', 'payment_due', 'payment_completed', 'status_change']),
    data: zod_1.z.record(zod_1.z.any()),
    timestamp: zod_1.z.number(),
});
// Error Types
exports.APIErrorSchema = zod_1.z.object({
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.any()).optional(),
    }),
    timestamp: zod_1.z.number(),
    path: zod_1.z.string(),
});
// Analytics Types
exports.AnalyticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    groupBy: zod_1.z.enum(['day', 'week', 'month']).default('day'),
    metrics: zod_1.z.array(zod_1.z.enum(['subscriptions', 'payments', 'volume', 'users'])).default(['subscriptions']),
});
// Blockchain Types
exports.TransactionReceiptSchema = zod_1.z.object({
    transactionHash: zod_1.z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    blockNumber: zod_1.z.number(),
    gasUsed: zod_1.z.string(),
    status: zod_1.z.number(),
    logs: zod_1.z.array(zod_1.z.any()),
});
// Rate Limiting Types
exports.RateLimitConfigSchema = zod_1.z.object({
    max: zod_1.z.number().positive(),
    timeWindow: zod_1.z.number().positive(),
    skipSuccessfulRequests: zod_1.z.boolean().default(false),
    skipFailedRequests: zod_1.z.boolean().default(false),
});
// JWT Types
exports.JWTPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
// Pagination Types
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1),
    limit: zod_1.z.number().min(1).max(100),
    total: zod_1.z.number().nonnegative(),
    totalPages: zod_1.z.number().nonnegative(),
    hasNext: zod_1.z.boolean(),
    hasPrev: zod_1.z.boolean(),
});
const PaginatedResponseSchema = (dataSchema) => zod_1.z.object({
    data: zod_1.z.array(dataSchema),
    pagination: exports.PaginationSchema,
});
exports.PaginatedResponseSchema = PaginatedResponseSchema;
// Health Check Types
exports.HealthCheckSchema = zod_1.z.object({
    status: zod_1.z.enum(['healthy', 'unhealthy']),
    timestamp: zod_1.z.number(),
    version: zod_1.z.string(),
    uptime: zod_1.z.number(),
    checks: zod_1.z.object({
        database: zod_1.z.boolean(),
        blockchain: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=index.js.map