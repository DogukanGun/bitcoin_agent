import { FastifyPluginAsync } from 'fastify';
import { ObjectId } from 'mongodb';
import { mongoService } from '@/utils/mongodb';
import { authenticateJWT } from '@/middleware/auth';

const providerRoutes: FastifyPluginAsync = async (fastify) => {
  // Register new provider
  fastify.post('/register', {
    preHandler: [authenticateJWT],
    schema: {
      tags: ['Providers'],
      summary: 'Register new provider',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          website: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['address', 'name'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            website: { type: 'string' },
            email: { type: 'string' },
            verified: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { address, name, description, website, email } = request.body as {
      address: string;
      name: string;
      description?: string;
      website?: string;
      email?: string;
    };

    try {
      const db = mongoService.getDb();
      const providersCollection = db.collection('providers');

      // Check if provider already exists
      const existing = await providersCollection.findOne({
        address: address.toLowerCase(),
      });

      if (existing) {
        return reply.status(409).send({
          error: {
            code: 'PROVIDER_EXISTS',
            message: 'Provider with this address already exists',
          },
          timestamp: Date.now(),
          path: request.url,
        });
      }

      // Create new provider
      const newProvider = {
        address: address.toLowerCase(),
        name,
        description: description || '',
        website: website || '',
        email: email || '',
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await providersCollection.insertOne(newProvider);

      reply.status(201);
      return {
        id: result.insertedId.toString(),
        address: newProvider.address,
        name: newProvider.name,
        description: newProvider.description,
        website: newProvider.website,
        email: newProvider.email,
        verified: newProvider.verified,
        createdAt: newProvider.createdAt.toISOString(),
      };
    } catch (error) {
      fastify.log.error({ error }, 'Provider registration failed');
      return reply.status(500).send({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register provider',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: Date.now(),
        path: request.url,
      });
    }
  });

  // Get all providers
  fastify.get('/', {
    schema: {
      tags: ['Providers'],
      summary: 'Get all providers',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          verified: { type: 'boolean' },
        },
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
                  id: { type: 'string' },
                  address: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  website: { type: 'string' },
                  verified: { type: 'boolean' },
                  createdAt: { type: 'string' },
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
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { page = 1, limit = 20, verified } = request.query as {
      page?: number;
      limit?: number;
      verified?: boolean;
    };

    try {
      const db = mongoService.getDb();
      const providersCollection = db.collection('providers');

      const filter: any = {};
      if (verified !== undefined) {
        filter.verified = verified;
      }

      const total = await providersCollection.countDocuments(filter);
      const skip = (page - 1) * limit;

      const providers = await providersCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return {
        data: providers.map((provider) => ({
          id: provider._id.toString(),
          address: provider.address,
          name: provider.name,
          description: provider.description || '',
          website: provider.website || '',
          verified: provider.verified,
          createdAt: provider.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch providers');
      return reply.status(500).send({
        error: {
          code: 'FETCH_PROVIDERS_FAILED',
          message: 'Failed to fetch providers',
        },
        timestamp: Date.now(),
        path: request.url,
      });
    }
  });

  // Get provider details
  fastify.get('/:providerId', {
    schema: {
      tags: ['Providers'],
      summary: 'Get provider details',
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
        },
        required: ['providerId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            website: { type: 'string' },
            email: { type: 'string' },
            verified: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { providerId } = request.params as { providerId: string };

    try {
      const db = mongoService.getDb();
      const providersCollection = db.collection('providers');

      let provider;
      
      // Try to find by MongoDB ObjectId first
      if (ObjectId.isValid(providerId)) {
        provider = await providersCollection.findOne({
          _id: new ObjectId(providerId),
        });
      }
      
      // If not found, try to find by address
      if (!provider) {
        provider = await providersCollection.findOne({
          address: providerId.toLowerCase(),
        });
      }

      if (!provider) {
        return reply.status(404).send({
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
          },
          timestamp: Date.now(),
          path: request.url,
        });
      }

      return {
        id: provider._id.toString(),
        address: provider.address,
        name: provider.name,
        description: provider.description || '',
        website: provider.website || '',
        email: provider.email || '',
        verified: provider.verified,
        createdAt: provider.createdAt.toISOString(),
        updatedAt: provider.updatedAt.toISOString(),
      };
    } catch (error) {
      fastify.log.error({ error, providerId }, 'Failed to fetch provider');
      return reply.status(500).send({
        error: {
          code: 'FETCH_PROVIDER_FAILED',
          message: 'Failed to fetch provider details',
        },
        timestamp: Date.now(),
        path: request.url,
      });
    }
  });

  // Update provider
  fastify.put('/:providerId', {
    preHandler: [authenticateJWT],
    schema: {
      tags: ['Providers'],
      summary: 'Update provider details',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
        },
        required: ['providerId'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          website: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            website: { type: 'string' },
            email: { type: 'string' },
            verified: { type: 'boolean' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { providerId } = request.params as { providerId: string };
    const updates = request.body as {
      name?: string;
      description?: string;
      website?: string;
      email?: string;
    };

    try {
      const db = mongoService.getDb();
      const providersCollection = db.collection('providers');

      if (!ObjectId.isValid(providerId)) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_PROVIDER_ID',
            message: 'Invalid provider ID',
          },
          timestamp: Date.now(),
          path: request.url,
        });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.email !== undefined) updateData.email = updates.email;

      const result = await providersCollection.findOneAndUpdate(
        { _id: new ObjectId(providerId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return reply.status(404).send({
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
          },
          timestamp: Date.now(),
          path: request.url,
        });
      }

      return {
        id: result._id.toString(),
        address: result.address,
        name: result.name,
        description: result.description || '',
        website: result.website || '',
        email: result.email || '',
        verified: result.verified,
        updatedAt: result.updatedAt.toISOString(),
      };
    } catch (error) {
      fastify.log.error({ error, providerId }, 'Failed to update provider');
      return reply.status(500).send({
        error: {
          code: 'UPDATE_PROVIDER_FAILED',
          message: 'Failed to update provider',
        },
        timestamp: Date.now(),
        path: request.url,
      });
    }
  });
};

export default providerRoutes;

