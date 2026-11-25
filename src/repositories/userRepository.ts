import { User } from '../models';
import type { CreationAttributes } from 'sequelize';

export const create = async (data: CreationAttributes<User>): Promise<User> => User.create(data);

export const findByEmail = async (email: string): Promise<User | null> => User.findOne({ where: { email } });

// Never returns the password hash.
export const findById = async (id: number): Promise<User | null> =>
  User.findByPk(id, {
    attributes: { exclude: ['password'] },
  });
