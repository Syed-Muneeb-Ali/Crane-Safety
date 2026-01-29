'use client';

import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken } from '@/lib/auth-client';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
    } else {
      // Only redirect if not already on login page
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [router, pathname]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Don't show layout on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-surface-50 min-h-screen animate-fade-in">{children}</main>
    </div>
  );
}

