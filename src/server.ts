import app from './app';
import { connectDB } from './config/db';
import { migrator } from './db/migrator';
import { PORT } from './config/env';

const start = async (): Promise<void> => {
  await connectDB();
  // The schema is managed by versioned migrations (src/db/migrations), never by sequelize.sync().
  try {
    await migrator.up();
  } catch (error) {
    console.error('Database migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

void start();
