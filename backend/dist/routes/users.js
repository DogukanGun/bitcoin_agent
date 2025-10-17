"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userRoutes = async (fastify) => {
    // Get user profile
    fastify.get('/:address', {
        schema: {
            tags: ['Users'],
            summary: 'Get user profile',
            params: {
                type: 'object',
                properties: {
                    address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
                },
                required: ['address'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        address: { type: 'string' },
                        userAgentAddress: { type: 'string', nullable: true },
                        createdAt: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        // TODO: Implement user profile retrieval
        return reply.status(501).send({
            error: {
                code: 'NOT_IMPLEMENTED',
                message: 'User profile retrieval not yet implemented',
            },
        });
    });
    // Create or update user
    fastify.post('/', {
        schema: {
            tags: ['Users'],
            summary: 'Create or update user',
            body: {
                type: 'object',
                properties: {
                    address: { type: 'string' },
                },
                required: ['address'],
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        address: { type: 'string' },
                        createdAt: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        // TODO: Implement user creation
        return reply.status(501).send({
            error: {
                code: 'NOT_IMPLEMENTED',
                message: 'User creation not yet implemented',
            },
        });
    });
};
exports.default = userRoutes;
//# sourceMappingURL=users.js.map