// Roles a collaborator can have on a task (see the backend's models/TaskCollaborator.ts).
export const COLLABORATOR_ROLES = ['viewer', 'editor'] as const;
export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

// TODO (yours): the Collaborator type, then collaborator.service.ts with
// GET/POST /tasks/:id/collaborators and PATCH/DELETE /tasks/:id/collaborators/:userId.
