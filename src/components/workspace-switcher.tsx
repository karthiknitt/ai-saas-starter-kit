'use client';

import {
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  userRole?: string;
}

interface WorkspaceSwitcherProps {
  className?: string;
  currentWorkspaceId?: string | null;
}

/**
 * Workspace switcher dropdown component for navigating between workspaces.
 * Displays current workspace and allows switching to other workspaces or creating new ones.
 *
 * @param currentWorkspaceId - ID of the currently selected workspace
 * @param className - Optional CSS classes
 */
export function WorkspaceSwitcher({
  className,
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const response = await fetch('/api/workspaces');
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data.workspaces || []);
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      } finally {
        setLoading(false);
      }
    }

    void fetchWorkspaces();
  }, []);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const handleWorkspaceSwitch = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      router.push(`/workspace/${workspace.slug}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'flex w-full items-center justify-between gap-2 px-3 py-2',
            className,
          )}
          disabled={loading}
          aria-label="Select workspace"
        >
          <div className="flex items-center gap-2 min-w-0">
            <IconBuilding className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium">
              {loading
                ? 'Loading...'
                : currentWorkspace?.name || 'Personal Workspace'}
            </span>
          </div>
          <IconChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.length === 0 && !loading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No workspaces found
          </div>
        ) : (
          workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleWorkspaceSwitch(workspace.id)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <IconBuilding className="h-4 w-4 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-medium">
                    {workspace.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {workspace.plan}
                  </span>
                </div>
              </div>
              {workspace.id === currentWorkspaceId && (
                <IconCheck className="h-4 w-4 shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/workspaces/create"
            className="flex items-center gap-2 cursor-pointer"
          >
            <IconPlus className="h-4 w-4" />
            <span className="text-sm">Create workspace</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/workspaces"
            className="flex items-center gap-2 cursor-pointer"
          >
            <IconBuilding className="h-4 w-4" />
            <span className="text-sm">Manage workspaces</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
