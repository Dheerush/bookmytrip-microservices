import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BookMyTrip - Search Service API',
      version: '1.0.0',
      description: 'Aggregate search across flights, trains, hotels, and cabs',
    },
    servers: [{ url: 'http://localhost:5007', description: 'Local' }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
