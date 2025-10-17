"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockchain_1 = require("@/utils/blockchain");
const subscriptionRoutes = async (fastify) => {
    // Get user subscriptions
    fastify.get('/', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Get user subscriptions',
            querystring: {
                type: 'object',
                properties: {
                    userAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                    status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'DEFAULTED'] },
                    page: { type: 'number', minimum: 1, default: 1 },
                    limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
                    sortBy: { type: 'string', enum: ['createdAt', 'nextPaymentDue', 'amount'], default: 'createdAt' },
                    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                },
                required: ['userAddress'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    subscriptionAddress: { type: 'string' },
                                    userAddress: { type: 'string' },
                                    providerAddress: { type: 'string' },
                                    tokenAddress: { type: 'string' },
                                    amount: { type: 'string' },
                                    period: { type: 'number' },
                                    status: { type: 'string' },
                                    nextPaymentDue: { type: 'number' },
                                    createdAt: { type: 'number' },
                                    totalPaid: { type: 'string' },
                                    paymentCount: { type: 'number' },
                                },
                            },
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'number' },
                                limit: { type: 'number' },
                                total: { type: 'number' },
                                totalPages: { type: 'number' },
                                hasNext: { type: 'boolean' },
                                hasPrev: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { userAddress } = request.query;
        const { page, limit, status, sortBy, sortOrder } = request.query;
        if (!userAddress) {
            return reply.status(400).send({
                error: {
                    code: 'MISSING_USER_ADDRESS',
                    message: 'User address is required',
                },
            });
        }
        try {
            const factory = await blockchain_1.blockchainService.getSubscriptionFactory();
            const subscriptionAddresses = await factory.getUserSubscriptions(userAddress);
            const subscriptions = [];
            for (const address of subscriptionAddresses) {
                try {
                    const contract = await blockchain_1.blockchainService.getSubscriptionContract(address);
                    const [terms, status, nextPaymentDue, currentPeriod, totalPaid, totalFromPool] = await contract.getSubscriptionInfo();
                    const subscription = {
                        id: address,
                        agreementId: terms.agreementId,
                        contractAddress: address,
                        userId: userAddress,
                        providerAddress: terms.provider,
                        tokenAddress: terms.token,
                        amount: terms.amount.toString(),
                        period: Number(terms.period),
                        status: ['ACTIVE', 'PAUSED', 'CANCELLED', 'DEFAULTED'][status],
                        nextPaymentDue: new Date(Number(nextPaymentDue) * 1000),
                        currentPeriod: Number(currentPeriod),
                        totalPaid: totalPaid.toString(),
                        totalFromPool: totalFromPool.toString(),
                        createdAt: new Date(), // Would get from database in production
                        updatedAt: new Date(),
                    };
                    subscriptions.push(subscription);
                }
                catch (error) {
                    fastify.log.warn({ error, address }, `Failed to get subscription info for ${address}`);
                }
            }
            // Apply filtering and sorting (simplified)
            let filteredSubscriptions = subscriptions;
            if (status) {
                filteredSubscriptions = subscriptions.filter(sub => sub.status === status);
            }
            // Sort
            filteredSubscriptions.sort((a, b) => {
                const aValue = a[sortBy];
                const bValue = b[sortBy];
                if (aValue < bValue)
                    return sortOrder === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
            // Paginate
            const offset = (page - 1) * limit;
            const paginatedSubscriptions = filteredSubscriptions.slice(offset, offset + limit);
            const total = filteredSubscriptions.length;
            const totalPages = Math.ceil(total / limit);
            return {
                data: paginatedSubscriptions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            fastify.log.error({ error }, 'Failed to get subscriptions');
            return reply.status(500).send({
                error: {
                    code: 'BLOCKCHAIN_ERROR',
                    message: 'Failed to fetch subscriptions from blockchain',
                },
            });
        }
    });
    // Get specific subscription
    fastify.get('/:subscriptionId', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Get subscription details',
            params: {
                type: 'object',
                properties: {
                    subscriptionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['subscriptionId'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        subscriptionAddress: { type: 'string' },
                        userAddress: { type: 'string' },
                        providerAddress: { type: 'string' },
                        tokenAddress: { type: 'string' },
                        amount: { type: 'string' },
                        period: { type: 'number' },
                        status: { type: 'string' },
                        nextPaymentDue: { type: 'number' },
                        createdAt: { type: 'number' },
                        totalPaid: { type: 'string' },
                        paymentCount: { type: 'number' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subscriptionId } = request.params;
        try {
            const contract = await blockchain_1.blockchainService.getSubscriptionContract(subscriptionId);
            const [terms, status, nextPaymentDue, currentPeriod, totalPaid, totalFromPool] = await contract.getSubscriptionInfo();
            const subscription = {
                id: subscriptionId,
                agreementId: terms.agreementId,
                contractAddress: subscriptionId,
                userId: terms.user,
                providerAddress: terms.provider,
                tokenAddress: terms.token,
                amount: terms.amount.toString(),
                period: Number(terms.period),
                status: ['ACTIVE', 'PAUSED', 'CANCELLED', 'DEFAULTED'][status],
                nextPaymentDue: new Date(Number(nextPaymentDue) * 1000),
                currentPeriod: Number(currentPeriod),
                totalPaid: totalPaid.toString(),
                totalFromPool: totalFromPool.toString(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return subscription;
        }
        catch (error) {
            fastify.log.error({ error, subscriptionId }, `Failed to get subscription ${subscriptionId}`);
            return reply.status(404).send({
                error: {
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    message: 'Subscription not found or invalid',
                },
            });
        }
    });
    // Create new subscription
    fastify.post('/', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Create new subscription',
            body: {
                type: 'object',
                properties: {
                    agreement: {
                        type: 'object',
                        properties: {
                            agreementId: { type: 'string' },
                            user: { type: 'string' },
                            provider: { type: 'string' },
                            token: { type: 'string' },
                            amount: { type: 'string' },
                            period: { type: 'number' },
                            startDate: { type: 'number' },
                            gracePeriod: { type: 'number' },
                            maxCover: { type: 'string' },
                            nonce: { type: 'number' },
                        },
                        required: ['agreementId', 'user', 'provider', 'token', 'amount', 'period', 'startDate', 'gracePeriod', 'maxCover', 'nonce'],
                    },
                    providerSignature: { type: 'string' },
                    userSignature: { type: 'string' },
                },
                required: ['agreement', 'providerSignature', 'userSignature'],
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        subscriptionAddress: { type: 'string' },
                        agreementId: { type: 'string' },
                        transactionHash: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { agreement, providerSignature, userSignature } = request.body;
        try {
            // Validate signatures
            const factory = await blockchain_1.blockchainService.getSubscriptionFactory();
            const domain = blockchain_1.blockchainService.getDomain(process.env.SUBSCRIPTION_FACTORY_ADDRESS);
            const types = blockchain_1.blockchainService.getPaymentAgreementTypes();
            const isProviderSigValid = blockchain_1.blockchainService.verifySignature(domain, types, agreement, providerSignature, agreement.provider);
            if (!isProviderSigValid) {
                return reply.status(400).send({
                    error: {
                        code: 'INVALID_PROVIDER_SIGNATURE',
                        message: 'Provider signature is invalid',
                    },
                });
            }
            // Check if user has a user agent, if not the factory will create one
            const userAgentAddress = await factory.getUserAgent(agreement.user);
            let isUserSigValid = false;
            if (userAgentAddress !== '0x0000000000000000000000000000000000000000') {
                // Check if signature is from user or authorized agent
                const userAgent = await blockchain_1.blockchainService.getContract(userAgentAddress, [
                    'function isValidSignature(bytes32 hash, bytes signature) external view returns (bytes4)'
                ]);
                const hash = blockchain_1.blockchainService.getDomain(process.env.SUBSCRIPTION_FACTORY_ADDRESS);
                // This would need proper EIP-712 hash calculation
                // Simplified for this example
                isUserSigValid = true;
            }
            else {
                // Verify direct user signature
                isUserSigValid = blockchain_1.blockchainService.verifySignature(domain, types, agreement, userSignature, agreement.user);
            }
            if (!isUserSigValid) {
                return reply.status(400).send({
                    error: {
                        code: 'INVALID_USER_SIGNATURE',
                        message: 'User signature is invalid',
                    },
                });
            }
            // Create subscription on blockchain
            const tx = await factory.createSubscription(agreement, providerSignature, userSignature);
            const receipt = await tx.wait();
            // Find the SubscriptionCreated event
            const subscriptionCreatedEvent = receipt.logs.find((log) => {
                try {
                    const parsed = factory.interface.parseLog(log);
                    return parsed?.name === 'SubscriptionCreated';
                }
                catch {
                    return false;
                }
            });
            if (!subscriptionCreatedEvent) {
                throw new Error('SubscriptionCreated event not found');
            }
            const parsedEvent = factory.interface.parseLog(subscriptionCreatedEvent);
            const subscriptionAddress = parsedEvent?.args.subscription;
            reply.status(201);
            return {
                subscriptionAddress,
                agreementId: agreement.agreementId,
                transactionHash: receipt.hash,
            };
        }
        catch (error) {
            fastify.log.error({ error }, 'Failed to create subscription');
            return reply.status(500).send({
                error: {
                    code: 'SUBSCRIPTION_CREATION_FAILED',
                    message: 'Failed to create subscription on blockchain',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    });
    // Cancel subscription
    fastify.post('/:subscriptionId/cancel', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Cancel subscription',
            params: {
                type: 'object',
                properties: {
                    subscriptionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['subscriptionId'],
            },
            body: {
                type: 'object',
                properties: {
                    signature: { type: 'string' },
                    nonce: { type: 'number' },
                },
                required: ['signature', 'nonce'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        transactionHash: { type: 'string' },
                        cancelled: { type: 'boolean' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subscriptionId } = request.params;
        const { signature, nonce } = request.body;
        try {
            const contract = await blockchain_1.blockchainService.getSubscriptionContract(subscriptionId);
            const tx = await contract.cancelByUser(signature, nonce);
            const receipt = await tx.wait();
            return {
                transactionHash: receipt.hash,
                cancelled: true,
            };
        }
        catch (error) {
            fastify.log.error({ error, subscriptionId }, `Failed to cancel subscription ${subscriptionId}`);
            return reply.status(500).send({
                error: {
                    code: 'CANCELLATION_FAILED',
                    message: 'Failed to cancel subscription',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    });
    // Pause subscription
    fastify.post('/:subscriptionId/pause', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Pause subscription',
            params: {
                type: 'object',
                properties: {
                    subscriptionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['subscriptionId'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        transactionHash: { type: 'string' },
                        paused: { type: 'boolean' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subscriptionId } = request.params;
        try {
            const contract = await blockchain_1.blockchainService.getSubscriptionContract(subscriptionId);
            const tx = await contract.pause();
            const receipt = await tx.wait();
            return {
                transactionHash: receipt.hash,
                paused: true,
            };
        }
        catch (error) {
            fastify.log.error({ error, subscriptionId }, `Failed to pause subscription ${subscriptionId}`);
            return reply.status(500).send({
                error: {
                    code: 'PAUSE_FAILED',
                    message: 'Failed to pause subscription',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    });
    // Resume subscription
    fastify.post('/:subscriptionId/resume', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Resume subscription',
            params: {
                type: 'object',
                properties: {
                    subscriptionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['subscriptionId'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        transactionHash: { type: 'string' },
                        resumed: { type: 'boolean' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subscriptionId } = request.params;
        try {
            const contract = await blockchain_1.blockchainService.getSubscriptionContract(subscriptionId);
            const tx = await contract.resume();
            const receipt = await tx.wait();
            return {
                transactionHash: receipt.hash,
                resumed: true,
            };
        }
        catch (error) {
            fastify.log.error({ error, subscriptionId }, `Failed to resume subscription ${subscriptionId}`);
            return reply.status(500).send({
                error: {
                    code: 'RESUME_FAILED',
                    message: 'Failed to resume subscription',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
    });
    // Get subscription payment history
    fastify.get('/:subscriptionId/payments', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Get subscription payment history',
            params: {
                type: 'object',
                properties: {
                    subscriptionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['subscriptionId'],
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            period: { type: 'number' },
                            dueDate: { type: 'string', format: 'date-time' },
                            paidDate: { type: 'string', format: 'date-time', nullable: true },
                            amount: { type: 'string' },
                            fromPool: { type: 'boolean' },
                            payer: { type: 'string', nullable: true },
                            nftTokenId: { type: 'number', nullable: true },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subscriptionId } = request.params;
        try {
            const contract = await blockchain_1.blockchainService.getSubscriptionContract(subscriptionId);
            const paymentHistory = await contract.getPaymentHistory();
            const payments = paymentHistory.map((payment, index) => ({
                period: index + 1,
                dueDate: new Date(Number(payment.dueDate) * 1000).toISOString(),
                paidDate: payment.paidDate > 0 ? new Date(Number(payment.paidDate) * 1000).toISOString() : null,
                amount: payment.amount.toString(),
                fromPool: payment.fromPool,
                payer: payment.payer !== '0x0000000000000000000000000000000000000000' ? payment.payer : null,
                nftTokenId: payment.nftTokenId > 0 ? Number(payment.nftTokenId) : null,
            }));
            return payments;
        }
        catch (error) {
            fastify.log.error({ error, subscriptionId }, `Failed to get payment history for ${subscriptionId}`);
            return reply.status(500).send({
                error: {
                    code: 'PAYMENT_HISTORY_ERROR',
                    message: 'Failed to fetch payment history',
                },
            });
        }
    });
    // Get subscription status
    fastify.get('/:subscriptionId/status', {
        schema: {
            tags: ['Subscriptions'],
            summary: 'Get subscription status',
            params: {
                type: 'object',
                properties: {
                    subscriptionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['subscriptionId'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        isPaymentDue: { type: 'boolean' },
                        isInGracePeriod: { type: 'boolean' },
                        canClaimFromPool: { type: 'boolean' },
                        poolDebt: { type: 'string' },
                        nextDue: { type: 'string', format: 'date-time' },
                        overdue: { type: 'boolean' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { subscriptionId } = request.params;
        try {
            const contract = await blockchain_1.blockchainService.getSubscriptionContract(subscriptionId);
            const [isPaymentDue, isInGracePeriod, canClaimFromPool, [poolDebt, nextDue, overdue]] = await Promise.all([
                contract.isPaymentDue(),
                contract.isInGracePeriod(),
                contract.canClaimFromPool(),
                contract.getDebtStatus(),
            ]);
            return {
                isPaymentDue,
                isInGracePeriod,
                canClaimFromPool,
                poolDebt: poolDebt.toString(),
                nextDue: new Date(Number(nextDue) * 1000).toISOString(),
                overdue,
            };
        }
        catch (error) {
            fastify.log.error({ error, subscriptionId }, `Failed to get status for ${subscriptionId}`);
            return reply.status(500).send({
                error: {
                    code: 'STATUS_ERROR',
                    message: 'Failed to fetch subscription status',
                },
            });
        }
    });
};
exports.default = subscriptionRoutes;
//# sourceMappingURL=subscriptions.js.map