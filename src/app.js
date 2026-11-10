const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const setupSwagger = require('./docs/swagger');
const { TRUST_PROXY } = require('./config/env');

const app = express();

if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);

app.use(helmet());
app.use(cors());
app.use(express.json());

setupSwagger(app);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(errorMiddleware);

module.exports = app;
