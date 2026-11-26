import { Sequelize } from 'sequelize';
import { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, NODE_ENV } from './env';

export const sequelize =
  NODE_ENV === 'test'
    ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'postgres',
        logging: NODE_ENV === 'development' ? console.log : false,
      });

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};
