import path from 'path';
import { Umzug, SequelizeStorage } from 'umzug';
import type { QueryInterface } from 'sequelize';
import { sequelize } from '../config/db';
import { NODE_ENV } from '../config/env';

// Schema changes are versioned files in src/db/migrations/, applied in name order.
// Applied migrations are recorded in the "SequelizeMeta" table (same format as sequelize-cli).
// Each file exports up(queryInterface) and down(queryInterface).
export interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

export const migrator = new Umzug({
  migrations: {
    // .ts in dev and tests (tsx, ts-jest), .js once compiled to dist/.
    glob: ['migrations/*.{js,ts}', { cwd: __dirname }],
    resolve: ({ name, path: filePath, context }) => {
      // The file is only known at runtime (found by the glob), hence require() and not import.
      const migration = require(filePath as string) as Migration;
      return {
        // Always record "xxx.js": that is what databases created before TypeScript contain,
        // and what dist/ runs. Without this, "xxx.ts" would look like a new migration in dev.
        name: `${path.parse(name).name}.js`,
        up: () => migration.up(context),
        down: () => migration.down(context),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
  logger: NODE_ENV === 'test' ? undefined : console,
});

// CLI: npm run migrate | migrate:undo | migrate:undo:all | migrate:status
// (in the production image: node dist/db/migrator.js <command>)
const runCli = async (command: string): Promise<void> => {
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
    console.error('Migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  void runCli(process.argv[2] || 'up');
}
