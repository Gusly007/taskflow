const { Sequelize } = require('sequelize');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, NODE_ENV } = require('./env');

let sequelize;

if (NODE_ENV === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
