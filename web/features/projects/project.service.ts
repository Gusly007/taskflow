// Every call to the /projects endpoints. One function per API route, typed in and out.
// No React or Next here: Server Actions and pages do that.
import 'server-only';
import { apiFetch } from '@/lib/api-client';
import type { Project } from './project.types';

// Projects the logged-in user owns or is a member of (not paginated), each with their role.
export async function listProjects(): Promise<Project[]> {
  const { data } = await apiFetch<Project[]>('/projects');
  return data;
}

// TODO (yours), same pattern: getProject(id), createProject(input), updateProject(id, input),
// deleteProject(id), and the members routes (GET/POST /projects/:id/members, PATCH/DELETE /projects/:id/members/:userId).
