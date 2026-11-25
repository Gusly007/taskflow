import type { Project, ProjectMember, Task, TaskCollaborator, User } from '../src/models';

// Unit tests mock the repositories, which return Sequelize instances. The services only read
// a few fields, so a plain object is enough: the cast tells TypeScript to treat it as the model.
export const fakeTask = (fields: Partial<Task>): Task => fields as Task;
export const fakeUser = (fields: Partial<User>): User => fields as User;
export const fakeCollaborator = (fields: Partial<TaskCollaborator>): TaskCollaborator => fields as TaskCollaborator;
export const fakeProject = (fields: Partial<Project>): Project => fields as Project;
export const fakeProjectMember = (fields: Partial<ProjectMember>): ProjectMember => fields as ProjectMember;
