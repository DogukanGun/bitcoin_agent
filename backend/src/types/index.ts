import { z } from 'zod';

// User Types
export const UserSchema = z.object({
  id: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  userAgentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Subscription Types
export const SubscriptionStatus = z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'DEFAULTED']);

export const PaymentAgreementSchema = z.object({
  agreementId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  user: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  provider: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  period: z.number().positive(),
  startDate: z.number().positive(),
  gracePeriod: z.number().positive(),
  maxCover: z.string(),
  nonce: z.number().nonnegative(),
});

export type PaymentAgreement = z.infer<typeof PaymentAgreementSchema>;

export const SubscriptionSchema = z.object({
  id: z.string(),
  agreementId: z.string(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  userId: z.string(),
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  period: z.number(),
  status: SubscriptionStatus,
  nextPaymentDue: z.date(),
  currentPeriod: z.number(),
  totalPaid: z.string(),
  totalFromPool: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Payment Types
export const PaymentRecordSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  period: z.number(),
  amount: z.string(),
  dueDate: z.date(),
  paidDate: z.date().nullable(),
  fromPool: z.boolean(),
  payerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable(),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),
  nftTokenId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

// Provider Types
export const ProviderSchema = z.object({
  id: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  verified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Provider = z.infer<typeof ProviderSchema>;

// Subscription Plan Types
export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  name: z.string(),
  description: z.string(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  period: z.number(),
  gracePeriod: z.number(),
  maxCover: z.string(),
  active: z.boolean(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

// NFT Types
export const PaymentPointNFTSchema = z.object({
  id: z.string(),
  tokenId: z.number(),
  userId: z.string(),
  subscriptionId: z.string(),
  amount: z.string(),
  score: z.number(),
  metadata: z.string().optional(),
  soulbound: z.boolean(),
  createdAt: z.date(),
});

export type PaymentPointNFT = z.infer<typeof PaymentPointNFTSchema>;

// API Request/Response Types
export const CreateSubscriptionRequestSchema = z.object({
  planId: z.string(),
  userSignature: z.string(),
  startDate: z.number().optional(),
});

export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;

export const GetSubscriptionsQuerySchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  status: SubscriptionStatus.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'nextPaymentDue', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetSubscriptionsQuery = z.infer<typeof GetSubscriptionsQuerySchema>;

export const PaymentQuoteRequestSchema = z.object({
  subscriptionId: z.string(),
  amount: z.string().optional(),
});

export type PaymentQuoteRequest = z.infer<typeof PaymentQuoteRequestSchema>;

export const PaymentQuoteResponseSchema = z.object({
  subscriptionId: z.string(),
  amount: z.string(),
  gasEstimate: z.string(),
  gasCost: z.string(),
  totalCost: z.string(),
  canSponsor: z.boolean(),
  expiresAt: z.number(),
});

export type PaymentQuoteResponse = z.infer<typeof PaymentQuoteResponseSchema>;

// WebSocket Types
export const WebSocketMessageSchema = z.object({
  type: z.enum(['subscription_update', 'payment_due', 'payment_completed', 'status_change']),
  data: z.record(z.any()),
  timestamp: z.number(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Error Types
export const APIErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
  timestamp: z.number(),
  path: z.string(),
});

export type APIError = z.infer<typeof APIErrorSchema>;

// Analytics Types
export const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum(['subscriptions', 'payments', 'volume', 'users'])).default(['subscriptions']),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

// Blockchain Types
export const TransactionReceiptSchema = z.object({
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  blockNumber: z.number(),
  gasUsed: z.string(),
  status: z.number(),
  logs: z.array(z.any()),
});

export type TransactionReceipt = z.infer<typeof TransactionReceiptSchema>;

// Rate Limiting Types
export const RateLimitConfigSchema = z.object({
  max: z.number().positive(),
  timeWindow: z.number().positive(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

// JWT Types
export const JWTPayloadSchema = z.object({
  userId: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Pagination Types
export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().nonnegative(),
  totalPages: z.number().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: PaginationSchema,
  });

// Health Check Types
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.number(),
  version: z.string(),
  uptime: z.number(),
  checks: z.object({
    database: z.boolean(),
    blockchain: z.boolean(),
  }),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;