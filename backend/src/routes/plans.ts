import { FastifyPluginAsync } from 'fastify';

const planRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all subscription plans
  fastify.get('/', {
    schema: {
      tags: ['Plans'],
      summary: 'Get all subscription plans',
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
                  name: { type: 'string' },
                  amount: { type: 'string' },
                  period: { type: 'number' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    // TODO: Implement plan listing
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Plan listing not yet implemented',
      },
    });
  });

  // Get plan details
  fastify.get('/:planId', {
    schema: {
      tags: ['Plans'],
      summary: 'Get plan details',
      params: {
        type: 'object',
        properties: {
          planId: { type: 'string' },
        },
        required: ['planId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            amount: { type: 'string' },
            period: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // TODO: Implement plan details retrieval
    return reply.status(501).send({
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Plan details not yet implemented',
      },
    });
  });
};

export default planRoutes;

