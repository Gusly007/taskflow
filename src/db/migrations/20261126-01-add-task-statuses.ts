// Two more task statuses, Jira-style: "backlog" (an idea, not planned yet) before "todo",
// and "in-review" before "done". The workflow becomes backlog -> todo -> in-progress -> in-review -> done.
// Existing tasks keep their status.
import type { QueryInterface } from 'sequelize';

const OLD_STATUSES = ['todo', 'in-progress', 'done'];

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // On SQLite an ENUM is a plain TEXT column: nothing to change.
  if (queryInterface.sequelize.getDialect() !== 'postgres') return;

  // BEFORE keeps the type's values in workflow order. IF NOT EXISTS makes the migration safe to re-run.
  await queryInterface.sequelize.query(`ALTER TYPE "enum_tasks_status" ADD VALUE IF NOT EXISTS 'backlog' BEFORE 'todo';`);
  await queryInterface.sequelize.query(`ALTER TYPE "enum_tasks_status" ADD VALUE IF NOT EXISTS 'in-review' BEFORE 'done';`);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Each new status goes back to the closest old one, so no task is lost.
  await queryInterface.sequelize.query(`UPDATE "tasks" SET "status" = 'todo' WHERE "status" = 'backlog';`);
  await queryInterface.sequelize.query(`UPDATE "tasks" SET "status" = 'in-progress' WHERE "status" = 'in-review';`);

  if (queryInterface.sequelize.getDialect() !== 'postgres') return;

  // PostgreSQL can't remove a value from an ENUM: build the old type again and switch the column to it.
  // The default ('todo') is dropped first because it is typed with the old ENUM and can't be cast.
  // One query with several statements = one implicit transaction: either all of it applies, or none.
  const values = OLD_STATUSES.map((status) => `'${status}'`).join(', ');
  await queryInterface.sequelize.query(`
    ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TYPE "enum_tasks_status" RENAME TO "enum_tasks_status_old";
    CREATE TYPE "enum_tasks_status" AS ENUM (${values});
    ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "enum_tasks_status" USING "status"::text::"enum_tasks_status";
    ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo';
    DROP TYPE "enum_tasks_status_old";
  `);
};
