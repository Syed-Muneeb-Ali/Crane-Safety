'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithAuth, removeToken } from '@/lib/auth-client';
import { getCachedUser, setCachedUser, type CachedUser } from '@/lib/auth-cache';

interface User extends CachedUser {}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Incidents', href: '/incidents', icon: '📋' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCachedUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', {
        method: 'POST',
      });
      removeToken();
      setCachedUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      removeToken();
      setCachedUser(null);
      router.push('/login');
    }
  };

  return (
    <div className="w-64 bg-surface-900 text-white min-h-screen p-5 flex flex-col shadow-premium animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-display font-bold tracking-tight">Crane Safety</h1>
        <p className="text-sm text-gray-400 mt-0.5">Monitoring System</p>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-1">
          {menuItems.map((item, i) => (
            <li key={item.href} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-primary-600 text-white shadow-button'
                    : 'text-gray-300 hover:bg-surface-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-surface-800">
        {!loading && user && (
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-surface-800 hover:text-white transition-all duration-200"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

