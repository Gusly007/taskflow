const { Umzug, SequelizeStorage } = require('umzug');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');
const { NODE_ENV } = require('../config/env');

// Schema changes are versioned files in src/db/migrations/, applied in name order.
// Applied migrations are recorded in the "SequelizeMeta" table (same format as sequelize-cli).
// Each file exports { up(queryInterface, Sequelize), down(queryInterface, Sequelize) }.
const migrator = new Umzug({
  migrations: {
    glob: ['migrations/*.js', { cwd: __dirname }],
    resolve: ({ name, path: filePath, context }) => {
      const migration = require(filePath);
      return {
        name,
        up: () => migration.up(context, Sequelize),
        down: () => migration.down(context, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
  logger: NODE_ENV === 'test' ? undefined : console,
});

module.exports = { migrator };

// CLI: npm run migrate | migrate:undo | migrate:undo:all | migrate:status
if (require.main === module) {
  const command = process.argv[2] || 'up';

  (async () => {
    try {
      if (command === 'up') {
        await migrator.up();
      } else if (command === 'down') {
        await migrator.down();
      } else if (command === 'down:all') {
        await migrator.down({ to: 0 });
      } else if (command === 'status') {
        const executed = (await migrator.executed()).map((m) => m.name);
        const pending = (await migrator.pending()).map((m) => m.name);
        console.log('Executed:', executed.length ? executed.join(', ') : '(none)');
        console.log('Pending: ', pending.length ? pending.join(', ') : '(none)');
      } else {
        throw new Error(`Unknown command "${command}". Use up, down, down:all or status.`);
      }
    } catch (error) {
      console.error('Migration failed:', error.message);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  })();
}
