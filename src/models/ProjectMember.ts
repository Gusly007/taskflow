import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/db';

// The project owner is Project.ownerId, never a row here.
export const PROJECT_MEMBER_ROLES = ['viewer', 'editor'] as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

class ProjectMember extends Model<InferAttributes<ProjectMember>, InferCreationAttributes<ProjectMember>> {
  declare id: CreationOptional<number>;
  declare projectId: number;
  declare userId: number;
  declare role: CreationOptional<ProjectMemberRole>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProjectMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...PROJECT_MEMBER_ROLES),
      defaultValue: 'viewer',
      allowNull: false,
    },
    // Filled in by Sequelize (timestamps: true), listed for the init() types.
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'ProjectMember',
    tableName: 'project_members',
    timestamps: true,
  },
);

export default ProjectMember;
