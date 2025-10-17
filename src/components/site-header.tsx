'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from './ui/modetoggle';
import { ThemeSelector } from './theme-selector';
import { SignoutButton } from './forms/signout';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

interface SiteHeaderProps {
  user?: User | null;
  pageTitle?: string;
}

export function SiteHeader({ user, pageTitle = 'Dashboard' }: SiteHeaderProps) {
  const firstName = user?.name?.split(' ')[0] || '';
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await authClient.getSession();
        const role = (session.data?.user as User)?.role as string | undefined;
        if (!cancelled) setIsAdmin(role === 'admin');
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          {user && (
            <h1 className="text-base font-medium">
              Welcome, {firstName}! | {pageTitle}
            </h1>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium underline">
              Admin
            </Link>
          )}
          <ThemeSelector />
          <ModeToggle />
          <SignoutButton className="min-w-[100px]" />
        </div>
      </div>
    </header>
  );
}
