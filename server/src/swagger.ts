// server/src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Forks & Feedback API',
      version: '1.0.0',
      description: 'API for discovering dining and live music experiences.',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/index.ts', './src/favoritesRouter.ts', './src/savedEventRouter.ts', './src/venueReviewRouter.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
export default specs;
