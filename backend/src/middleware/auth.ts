import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '@/utils/jwt';

export async function authenticateJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
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
    const decoded = verifyToken(token);

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
    (request as any).user = decoded;
  } catch (error) {
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

export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        (request as any).user = decoded;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
}

