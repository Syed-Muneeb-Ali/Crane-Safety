'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { fetchWithAuth } from '@/lib/auth-client';
import { setToken } from '@/lib/auth-client';
import { setCachedUser } from '@/lib/auth-cache';
import PasswordInput from '@/components/PasswordInput';

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUsername(data.user.username || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess(false);
    const newUsername = username.trim();
    if (!newUsername || newUsername === user?.username) return;
    if (newUsername.length < 2) {
      setUsernameError('Username must be at least 2 characters');
      return;
    }
    setUsernameSaving(true);
    try {
      const response = await fetchWithAuth('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUsernameError(data.error || 'Failed to update username');
        setUsernameSaving(false);
        return;
      }
      if (data.token) setToken(data.token);
      if (data.user) {
        setUser(data.user);
        setCachedUser(data.user);
      }
      setUsernameSuccess(true);
      setUsernameError('');
    } catch (error) {
      setUsernameError('Failed to update username');
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (!currentPassword) {
      setPasswordError('Enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetchWithAuth('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error || 'Failed to update password');
        setPasswordSaving(false);
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      setPasswordError('Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[300px]">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-display font-bold mb-6 text-surface-900">Settings</h1>

        <div className="space-y-6 max-w-xl">
          <section className="card p-6 animate-fade-in-up">
            <h2 className="text-lg font-display font-semibold mb-4 text-surface-900">Change Username</h2>
            {user && (
              <p className="text-sm text-gray-600 mb-4">
                Current username: <span className="font-semibold text-surface-900">{user.username}</span>
              </p>
            )}
            <form onSubmit={handleChangeUsername} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError('');
                    setUsernameSuccess(false);
                  }}
                  required
                  minLength={2}
                  className="input-field"
                  placeholder="Your username"
                />
              </div>
              {usernameError && <p className="text-sm text-red-600">{usernameError}</p>}
              {usernameSuccess && <p className="text-sm text-green-600">Username updated successfully.</p>}
              <button
                type="submit"
                disabled={usernameSaving || username.trim() === user?.username}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {usernameSaving ? 'Saving...' : 'Save Username'}
              </button>
            </form>
          </section>

          <section className="card p-6 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
            <h2 className="text-lg font-display font-semibold mb-4 text-surface-900">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess(false);
                }}
                required
                placeholder="Current password"
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess(false);
                }}
                required
                minLength={6}
                placeholder="New password (min 6 characters)"
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                  setPasswordSuccess(false);
                }}
                required
                minLength={6}
                placeholder="Confirm new password"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-600">Password updated successfully.</p>}
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
