import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import projectRoutes from './routes/projectRoutes';
import errorMiddleware from './middlewares/errorMiddleware';
import setupSwagger from './docs/swagger';
import { TRUST_PROXY } from './config/env';

const app = express();

if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);

app.use(helmet());
app.use(cors());
app.use(express.json());

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

app.use(errorMiddleware);

export default app;
