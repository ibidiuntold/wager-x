import jwt from 'jsonwebtoken';

export interface DecodedToken {
  email: string;
  id: string;
  iat: number;
  exp: number;
}

export function generateToken(email: string, userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // The payload now includes both the user's email and ID
  return jwt.sign({ email, id: userId }, secret, { expiresIn: '1h' });
}

export function verifyToken(token: string): DecodedToken | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}