"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webhookRoutes = async (fastify) => {
    // Register webhook
    fastify.post('/register', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Register webhook',
            body: {
                type: 'object',
                properties: {
                    url: { type: 'string' },
                    events: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                required: ['url', 'events'],
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        url: { type: 'string' },
                        events: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        // TODO: Implement webhook registration
        return reply.status(501).send({
            error: {
                code: 'NOT_IMPLEMENTED',
                message: 'Webhook registration not yet implemented',
            },
        });
    });
    // Get webhooks
    fastify.get('/', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Get registered webhooks',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    url: { type: 'string' },
                                    events: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        // TODO: Implement webhook listing
        return reply.status(501).send({
            error: {
                code: 'NOT_IMPLEMENTED',
                message: 'Webhook listing not yet implemented',
            },
        });
    });
};
exports.default = webhookRoutes;
//# sourceMappingURL=webhooks.js.map