"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.optionalAuth = optionalAuth;
const jwt_1 = require("@/utils/jwt");
async function authenticateJWT(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Authorization token is required',
                },
                timestamp: Date.now(),
                path: request.url,
            });
        }
        const token = authHeader.substring(7);
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            return reply.status(401).send({
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired token',
                },
                timestamp: Date.now(),
                path: request.url,
            });
        }
        // Add user info to request
        request.user = decoded;
    }
    catch (error) {
        return reply.status(401).send({
            error: {
                code: 'AUTHENTICATION_FAILED',
                message: 'Authentication failed',
            },
            timestamp: Date.now(),
            path: request.url,
        });
    }
}
async function optionalAuth(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = (0, jwt_1.verifyToken)(token);
            if (decoded) {
                request.user = decoded;
            }
        }
    }
    catch (error) {
        // Ignore errors for optional auth
    }
}
//# sourceMappingURL=auth.js.map