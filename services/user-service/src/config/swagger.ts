import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'BookMyTrip — User Service',
    version: '1.0.0',
    description: 'User profiles, traveler management, address book, preferences and session management',
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerSpec = swaggerJsdoc({ swaggerDefinition: definition, apis: ['./src/routes/*.ts'] });
