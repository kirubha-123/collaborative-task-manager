import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface AuthResult {
  user: { id: string; name: string; email: string };
  token: string;
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResult> => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('Email already in use');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
    token
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid credentials');

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
    token
  };
};
