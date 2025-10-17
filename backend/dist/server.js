"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastify = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const dotenv_1 = require("dotenv");
const blockchain_1 = require("@/utils/blockchain");
const mongodb_1 = require("@/utils/mongodb");
// Routes
const auth_1 = __importDefault(require("@/routes/auth"));
const users_1 = __importDefault(require("@/routes/users"));
const subscriptions_1 = __importDefault(require("@/routes/subscriptions"));
const providers_1 = __importDefault(require("@/routes/providers"));
const plans_1 = __importDefault(require("@/routes/plans"));
const payments_1 = __importDefault(require("@/routes/payments"));
const analytics_1 = __importDefault(require("@/routes/analytics"));
const health_1 = __importDefault(require("@/routes/health"));
const webhooks_1 = __importDefault(require("@/routes/webhooks"));
// Load environment variables
(0, dotenv_1.config)();
const fastify = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    },
});
exports.fastify = fastify;
// Register plugins
async function registerPlugins() {
    // Security
    await fastify.register(helmet_1.default, {
        contentSecurityPolicy: false, // Disable for development
    });
    // CORS
    await fastify.register(cors_1.default, {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    // Rate limiting
    await fastify.register(rate_limit_1.default, {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    });
    // Swagger documentation
    await fastify.register(swagger_1.default, {
        swagger: {
            info: {
                title: 'PayGuard API',
                description: 'Bitcoin subscription platform API for Mezo chain',
                version: '1.0.0',
            },
            host: 'localhost:3001',
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: ['application/json'],
            securityDefinitions: {
                Bearer: {
                    type: 'apiKey',
                    name: 'Authorization',
                    in: 'header',
                },
            },
        },
    });
    await fastify.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
    });
}
// Register routes
async function registerRoutes() {
    await fastify.register(health_1.default, { prefix: '/api/health' });
    await fastify.register(auth_1.default, { prefix: '/api/auth' });
    await fastify.register(users_1.default, { prefix: '/api/users' });
    await fastify.register(subscriptions_1.default, { prefix: '/api/subscriptions' });
    await fastify.register(providers_1.default, { prefix: '/api/providers' });
    await fastify.register(plans_1.default, { prefix: '/api/plans' });
    await fastify.register(payments_1.default, { prefix: '/api/payments' });
    await fastify.register(analytics_1.default, { prefix: '/api/analytics' });
    await fastify.register(webhooks_1.default, { prefix: '/api/webhooks' });
}
// Error handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    // Validation errors
    if (error.validation) {
        return reply.status(400).send({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: error.validation,
            },
            timestamp: Date.now(),
            path: request.url,
        });
    }
    // Rate limiting errors
    if (error.statusCode === 429) {
        return reply.status(429).send({
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests',
            },
            timestamp: Date.now(),
            path: request.url,
        });
    }
    // Authentication errors
    if (error.statusCode === 401) {
        return reply.status(401).send({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            },
            timestamp: Date.now(),
            path: request.url,
        });
    }
    // Default error
    reply.status(error.statusCode || 500).send({
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Internal server error',
        },
        timestamp: Date.now(),
        path: request.url,
    });
});
// Not found handler
fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${request.method} ${request.url} not found`,
        },
        timestamp: Date.now(),
        path: request.url,
    });
});
// Health check for readiness probe
fastify.addHook('onReady', async () => {
    try {
        // Connect to MongoDB (optional - won't crash if not configured)
        try {
            await mongodb_1.mongoService.connect();
            if (mongodb_1.mongoService.isConnected()) {
                fastify.log.info('Connected to MongoDB');
            }
            else {
                fastify.log.warn('MongoDB not configured. Database features will be disabled.');
            }
        }
        catch (error) {
            fastify.log.error({ error }, 'MongoDB connection failed. Database features will be disabled.');
        }
        // Test blockchain connection (optional - won't crash if not configured)
        if (blockchain_1.blockchainService.isAvailable()) {
            try {
                const networkInfo = await blockchain_1.blockchainService.getNetworkInfo();
                fastify.log.info({ networkInfo }, 'Connected to blockchain');
            }
            catch (error) {
                fastify.log.warn({ error }, 'Blockchain connection failed, but continuing without it');
            }
        }
        else {
            fastify.log.warn('Blockchain not configured. Subscription features will be disabled.');
        }
        fastify.log.info('Server is ready');
    }
    catch (error) {
        fastify.log.error({ error }, 'Failed to initialize services');
        throw error;
    }
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    fastify.log.info(`Received ${signal}, starting graceful shutdown`);
    try {
        await fastify.close();
        await mongodb_1.mongoService.disconnect();
        fastify.log.info('Server closed successfully');
        process.exit(0);
    }
    catch (error) {
        fastify.log.error({ error }, 'Error during shutdown');
        process.exit(1);
    }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Start server
const start = async () => {
    try {
        await registerPlugins();
        await registerRoutes();
        const port = parseInt(process.env.PORT || '3001');
        const host = process.env.HOST || '0.0.0.0';
        await fastify.listen({ port, host });
        fastify.log.info(`PayGuard API server running on http://${host}:${port}`);
        fastify.log.info(`API documentation available at http://${host}:${port}/docs`);
    }
    catch (error) {
        fastify.log.error({ error }, 'Failed to start server');
        process.exit(1);
    }
};
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    fastify.log.fatal({ error }, 'Uncaught exception');
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    fastify.log.fatal({ reason, promise }, 'Unhandled rejection');
    process.exit(1);
});
if (require.main === module) {
    start();
}
exports.default = fastify;
//# sourceMappingURL=server.js.map