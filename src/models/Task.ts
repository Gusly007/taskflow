import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/db';

// `as const` keeps the exact strings, so TypeScript can derive the union types below.
// Statuses are listed in workflow order: sorting by status follows this order (taskRepository).
// Adding one needs a migration too (ALTER TYPE "enum_tasks_status" on PostgreSQL).
export const TASK_STATUSES = ['backlog', 'todo', 'in-progress', 'in-review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
// The title column is a VARCHAR(255) (Sequelize's default STRING length): validators use the same limit.
export const TASK_TITLE_MAX_LENGTH = 255;
export const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]; // 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

class Task extends Model<InferAttributes<Task>, InferCreationAttributes<Task>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<TaskStatus>;
  declare priority: CreationOptional<TaskPriority>;
  // Calendar day only ("2026-11-20"): Sequelize returns DATEONLY as a string, not a Date.
  declare dueDate: CreationOptional<string | null>;
  declare userId: number;
  // Project the task belongs to, or null for a personal task.
  declare projectId: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(TASK_TITLE_MAX_LENGTH),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUSES),
      defaultValue: 'todo',
    },
    priority: {
      type: DataTypes.ENUM(...TASK_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    // Filled in by Sequelize (timestamps: true). Listed only because the init() types require
    // every declared attribute; this is what the Sequelize docs recommend.
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
  },
);

export default Task;
