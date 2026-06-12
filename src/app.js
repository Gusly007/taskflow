const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const setupSwagger = require('./docs/swagger');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(errorMiddleware);

module.exports = app;
