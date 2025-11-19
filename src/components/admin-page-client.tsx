'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { PageErrorBoundary } from '@/components/error-boundary';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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

export function AdminPageClient({ user }: { user: User }) {
  return (
    <PageErrorBoundary>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader user={user} pageTitle="Admin Dashboard" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="p-10">
                  <h1 className="mb-4 text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground">
                    Welcome {user.name ?? user.email}. You have admin access.
                  </p>
                  {/* Add your admin widgets here */}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PageErrorBoundary>
  );
}
