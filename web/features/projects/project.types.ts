// Project shapes returned by the API (see the backend's models/Project.ts and services/projectService.ts).

// The owner is the project's creator; members are viewers or editors.
export const PROJECT_ROLES = ['owner', 'editor', 'viewer'] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  role: ProjectRole; // role of the logged-in user in this project
  createdAt: string; // ISO date
  updatedAt: string;
}
