'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AuditLogsClient } from '@/components/audit-logs-client';
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

export function AdminAuditLogsPageClient({ user }: { user: User }) {
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
          <SiteHeader user={user} pageTitle="Audit Logs" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="container mx-auto space-y-6 p-6">
                  <div>
                    <h1 className="text-3xl font-bold">Audit Logs</h1>
                    <p className="text-muted-foreground mt-2">
                      View all system audit logs and administrative actions
                    </p>
                  </div>
                  <AuditLogsClient />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PageErrorBoundary>
  );
}
