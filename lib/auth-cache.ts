const USER_CACHE_KEY = 'crane_safety_user';

export interface CachedUser {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  name: string;
}

export function getCachedUser(): CachedUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(USER_CACHE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: CachedUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}
