import * as userRepository from '../repositories/userRepository';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import ApiError from '../utils/apiError';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export type LoginInput = Pick<RegisterInput, 'email' | 'password'>;

// What the client receives: never the password hash.
export interface AuthResult {
  user: { id: number; name: string; email: string };
  token: string;
}

export const register = async ({ name, email, password }: RegisterInput): Promise<AuthResult> => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'Email already in use');
  }

  const hashedPassword = await hashPassword(password);
  const user = await userRepository.create({ name, email, password: hashedPassword });
  const token = generateToken({ id: user.id });

  return { user: { id: user.id, name: user.name, email: user.email }, token };
};

export const login = async ({ email, password }: LoginInput): Promise<AuthResult> => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken({ id: user.id });

  return { user: { id: user.id, name: user.name, email: user.email }, token };
};
