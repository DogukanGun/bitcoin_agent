import { FastifyPluginAsync } from 'fastify';
import { ethers } from 'ethers';
import { mongoService } from '@/utils/mongodb';
import { generateToken, verifyToken } from '@/utils/jwt';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Login with signature verification
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'User login with signature verification',
      body: {
        type: 'object',
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          message: { type: 'string' },
          signature: { type: 'string' },
        },
        required: ['address', 'message', 'signature'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                address: { type: 'string' },
                userAgentAddress: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { address, message, signature } = request.body as { 
      address: string; 
      message: string; 
      signature: string;
    };

    try {
      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return reply.status(401).send({
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed',
          },
          timestamp: Date.now(),
          path: request.url,
        });
      }

      // Check if user exists, if not create
      const db = mongoService.getDb();
      const usersCollection = db.collection('users');
      
      let user = await usersCollection.findOne({ 
        address: address.toLowerCase() 
      });

      if (!user) {
        // Create new user
        const newUser = {
          address: address.toLowerCase(),
          userAgentAddress: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const result = await usersCollection.insertOne(newUser);
        user = { _id: result.insertedId, ...newUser };
      } else {
        // Update last login
        await usersCollection.updateOne(
          { address: address.toLowerCase() },
          { $set: { updatedAt: new Date() } }
        );
      }

      // Generate JWT token
      const token = generateToken(user._id.toString(), user.address);

      return {
        token,
        user: {
          id: user._id.toString(),
          address: user.address,
          userAgentAddress: user.userAgentAddress,
          createdAt: user.createdAt.toISOString(),
        },
      };
    } catch (error) {
      fastify.log.error({ error }, 'Login failed');
      return reply.status(500).send({
        error: {
          code: 'LOGIN_FAILED',
          message: 'Authentication failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: Date.now(),
        path: request.url,
      });
    }
  });

  // Get nonce for signing
  fastify.get('/nonce/:address', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get nonce for signing',
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
            message: { type: 'string' },
            address: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { address } = request.params as { address: string };
    
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with PayGuard.\n\nAddress: ${address}\nTimestamp: ${timestamp}`;
    
    return {
      message,
      address: address.toLowerCase(),
    };
  });

  // Verify token
  fastify.post('/verify', {
    schema: {
      tags: ['Authentication'],
      summary: 'Verify JWT token',
      body: {
        type: 'object',
        properties: {
          token: { type: 'string' },
        },
        required: ['token'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                address: { type: 'string' },
              },
              nullable: true,
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { token } = request.body as { token: string };

    const decoded = verifyToken(token);

    if (!decoded) {
      return {
        valid: false,
        user: null,
      };
    }

    return {
      valid: true,
      user: {
        userId: decoded.userId,
        address: decoded.address,
      },
    };
  });

  // Get current user info
  fastify.get('/me', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get current authenticated user',
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            userAgentAddress: { type: 'string', nullable: true },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
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

    try {
      const db = mongoService.getDb();
      const usersCollection = db.collection('users');
      
      const user = await usersCollection.findOne({ 
        address: decoded.address.toLowerCase() 
      });

      if (!user) {
        return reply.status(404).send({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          timestamp: Date.now(),
          path: request.url,
        });
      }

      return {
        id: user._id.toString(),
        address: user.address,
        userAgentAddress: user.userAgentAddress,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get user info');
      return reply.status(500).send({
        error: {
          code: 'FETCH_USER_FAILED',
          message: 'Failed to fetch user information',
        },
        timestamp: Date.now(),
        path: request.url,
      });
    }
  });
};

export default authRoutes;

