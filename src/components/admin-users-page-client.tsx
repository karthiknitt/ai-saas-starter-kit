'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { PageErrorBoundary } from '@/components/error-boundary';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { UsersClient } from '@/components/users-client';

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

interface PaginationData {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function AdminUsersPageClient({
  currentUser,
  users,
  pagination,
}: {
  currentUser: User;
  users: { id: string; name: string; email: string; role: string }[];
  pagination: PaginationData;
}) {
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
        <AppSidebar variant="inset" user={currentUser} />
        <SidebarInset>
          <SiteHeader user={currentUser} pageTitle="Manage Users" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="p-10">
                  <h1 className="mb-4 text-2xl font-bold">Manage Users</h1>
                  <UsersClient users={users} pagination={pagination} />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PageErrorBoundary>
  );
}
