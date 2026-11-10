const app = require('./app');
const { connectDB } = require('./config/db');
const { migrator } = require('./db/migrator');
const { PORT } = require('./config/env');

const start = async () => {
  await connectDB();
  // The schema is managed by versioned migrations (src/db/migrations), never by sequelize.sync().
  try {
    await migrator.up();
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
