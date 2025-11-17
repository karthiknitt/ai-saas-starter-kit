import { IconBuilding, IconSettings, IconUsers } from '@tabler/icons-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

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
import {
  getWorkspaceBySlug,
  getWorkspaceMembers,
  getWorkspaceRole,
} from '@/lib/workspace';

interface WorkspacePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Workspace overview page showing workspace details and quick actions.
 * Displays workspace info, member count, and links to settings and members.
 */
export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const workspace = await getWorkspaceBySlug(slug);

  if (!workspace) {
    notFound();
  }

  const userRole = await getWorkspaceRole(session.user.id, workspace.id);

  if (!userRole) {
    redirect('/dashboard/workspaces');
  }

  const members = await getWorkspaceMembers(workspace.id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <IconBuilding className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-muted-foreground">/{workspace.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WorkspaceBadge plan={workspace.plan} />
          <RoleBadge
            role={userRole as 'owner' | 'admin' | 'member' | 'viewer'}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconUsers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>{members.length} members</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage workspace members and their roles
            </p>
            <Button asChild className="w-full">
              <Link href={`/workspace/${slug}/members`}>
                <IconUsers className="h-4 w-4 mr-2" />
                View Members
              </Link>
            </Button>
          </CardContent>
        </Card>

        {(userRole === 'owner' || userRole === 'admin') && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconSettings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Workspace configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Update workspace name and plan settings
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/workspace/${slug}/settings`}>
                  <IconSettings className="h-4 w-4 mr-2" />
                  Manage Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
