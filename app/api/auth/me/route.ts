import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToken,
  updateUserUsername,
  updateUserPassword,
  getUserById,
  verifyPassword,
  hashPassword,
  generateToken,
} from '@/lib/auth';

function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let updatedUser = { ...user };
    let newToken: string | null = null;

    if (body.username != null && typeof body.username === 'string') {
      const newUsername = body.username.trim();
      if (newUsername.length < 2) {
        return NextResponse.json(
          { error: 'Username must be at least 2 characters' },
          { status: 400 }
        );
      }
      const ok = await updateUserUsername(user.id, newUsername);
      if (!ok) {
        return NextResponse.json(
          { error: 'Username is already taken or update failed' },
          { status: 400 }
        );
      }
      updatedUser = { ...updatedUser, username: newUsername };
      newToken = generateToken(updatedUser);
    }

    if (body.newPassword != null && typeof body.newPassword === 'string') {
      const currentPassword = body.currentPassword;
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }
      const dbUser = await getUserById(user.id);
      if (!dbUser || !(await verifyPassword(currentPassword, dbUser.password_hash))) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }
      const newHash = await hashPassword(body.newPassword);
      const ok = await updateUserPassword(user.id, newHash);
      if (!ok) {
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      user: updatedUser,
      ...(newToken && { token: newToken }),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
