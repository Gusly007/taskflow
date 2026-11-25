import path from 'path';
import type { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// The @swagger comments live in the route files. Resolve them from this file's folder so it
// works from src/ (dev, tests: .ts) and from dist/ (production: .js). glob wants "/" even on Windows.
const routeFiles = path.join(__dirname, '..', 'routes', '*.{js,ts}').split(path.sep).join('/');

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: 'A REST API for managing tasks',
    },
    servers: [{ url: '/api' }],
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
  apis: [routeFiles],
};

export const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
