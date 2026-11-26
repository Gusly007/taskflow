export interface User {
  id: number;
  name: string;
  email: string;
}

// What POST /auth/login and /auth/register return.
export interface AuthResult {
  user: User;
  token: string;
}
