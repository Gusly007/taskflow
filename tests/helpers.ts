import request from 'supertest';
import app from '../src/app';

interface UserData {
  name: string;
  email: string;
  password: string;
}

export const createUser = async (overrides: Partial<UserData> = {}): Promise<{ token: string; userId: number }> => {
  const data: UserData = {
    name: 'Test User',
    email: 'test@test.com',
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(data);
  return { token: res.body.data.token, userId: res.body.data.user.id };
};

export type TestUser = Awaited<ReturnType<typeof createUser>>;

// A task as the API sends it (JSON, so dates are strings).
export interface TaskJson {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export const createTask = async (token: string, overrides: Record<string, unknown> = {}): Promise<TaskJson> => {
  const data = { title: 'Test Task', ...overrides };
  const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send(data);
  return res.body.data;
};
