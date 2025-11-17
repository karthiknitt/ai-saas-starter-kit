import { IconBuilding, IconPlus } from '@tabler/icons-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { RoleBadge } from '@/components/role-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WorkspaceBadge } from '@/components/workspace-badge';
import { auth } from '@/lib/auth';
import { getUserWorkspaces } from '@/lib/workspace';

/**
 * Workspace management page showing all workspaces the user belongs to.
 * Displays workspace name, plan, role, and member count.
 */
export default async function WorkspacesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const workspaces = await getUserWorkspaces(session.user.id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-2">
            Manage your workspaces and team collaboration
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/workspaces/create">
            <IconPlus className="h-4 w-4 mr-2" />
            Create Workspace
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconBuilding className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Create your first workspace to start collaborating with your team
            </p>
            <Button asChild>
              <Link href="/dashboard/workspaces/create">
                <IconPlus className="h-4 w-4 mr-2" />
                Create Workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.slug}`}
              className="group"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconBuilding className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">
                          {workspace.name}
                        </CardTitle>
                        <CardDescription className="truncate">
                          /{workspace.slug}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <WorkspaceBadge plan={workspace.plan} />
                        {workspace.userRole && (
                          <RoleBadge
                            role={
                              workspace.userRole as
                                | 'owner'
                                | 'admin'
                                | 'member'
                                | 'viewer'
                            }
                          />
                        )}
                      </div>
                      {workspace.memberCount !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          {workspace.memberCount}{' '}
                          {workspace.memberCount === 1 ? 'member' : 'members'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
