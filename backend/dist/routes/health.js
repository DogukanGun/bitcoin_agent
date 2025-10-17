"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const healthRoutes = async (fastify) => {
    // Basic health check
    fastify.get('/', {
        schema: {
            tags: ['Health'],
            summary: 'Health check endpoint',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'number' },
                        uptime: { type: 'number' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return {
            status: 'healthy',
            timestamp: Date.now(),
            uptime: process.uptime(),
        };
    });
    // Detailed health check
    fastify.get('/detailed', {
        schema: {
            tags: ['Health'],
            summary: 'Detailed health check',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'number' },
                        uptime: { type: 'number' },
                        version: { type: 'string' },
                        checks: {
                            type: 'object',
                            properties: {
                                blockchain: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return {
            status: 'healthy',
            timestamp: Date.now(),
            uptime: process.uptime(),
            version: '1.0.0',
            checks: {
                blockchain: true,
            },
        };
    });
};
exports.default = healthRoutes;
//# sourceMappingURL=health.js.map