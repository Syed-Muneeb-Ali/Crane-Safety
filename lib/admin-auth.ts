import { NextRequest } from 'next/server';
import { verifyToken } from './auth';

export function requireAdmin(request: NextRequest): { user: any } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return { user };
}
