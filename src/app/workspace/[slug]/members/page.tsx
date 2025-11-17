'use client';

import { IconArrowLeft, IconUser, IconUserPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { RoleBadge } from '@/components/role-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  createdAt: Date;
  userName?: string;
  userEmail?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

/**
 * Workspace members management page.
 * Displays list of members with ability to add, remove, and update roles.
 */
export default function WorkspaceMembersPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<
    'admin' | 'member' | 'viewer'
  >('member');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch workspace
        const wsResponse = await fetch(`/api/workspaces?slug=${slug}`);
        if (wsResponse.ok) {
          const wsData = await wsResponse.json();
          if (wsData.workspaces && wsData.workspaces.length > 0) {
            const ws = wsData.workspaces[0];
            setWorkspace(ws);

            // Fetch members
            const membersResponse = await fetch(
              `/api/workspaces/${ws.id}/members`,
            );
            if (membersResponse.ok) {
              const membersData = await membersResponse.json();
              setMembers(membersData.members || []);
            }
          }
        }
      } catch (_error) {
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      void fetchData();
    }
  }, [slug]);

  async function handleAddMember() {
    if (!workspace || !newMemberEmail) return;

    setIsAddingMember(true);

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      toast.success('Member added successfully');
      setAddMemberOpen(false);
      setNewMemberEmail('');
      setNewMemberRole('member');

      // Refresh members list
      const membersResponse = await fetch(
        `/api/workspaces/${workspace.id}/members`,
      );
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add member',
      );
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleUpdateRole(
    userId: string,
    newRole: 'owner' | 'admin' | 'member' | 'viewer',
  ) {
    if (!workspace) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/members/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      toast.success('Member role updated successfully');

      // Update local state
      setMembers((prev) =>
        prev.map((member) =>
          member.userId === userId ? { ...member, role: newRole } : member,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update role',
      );
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!workspace) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/members/${userId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      toast.success('Member removed successfully');

      // Update local state
      setMembers((prev) => prev.filter((member) => member.userId !== userId));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove member',
      );
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <p className="text-center text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/workspace/${slug}`}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workspace Members
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage members and their roles in {workspace.name}
          </p>
        </div>

        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconUserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Invite a user to join this workspace by their email address
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={isAddingMember}
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value: 'admin' | 'member' | 'viewer') =>
                    setNewMemberRole(value)
                  }
                  disabled={isAddingMember}
                >
                  <SelectTrigger id="role" aria-required="true">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAddMemberOpen(false)}
                disabled={isAddingMember}
              >
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={isAddingMember}>
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            Users who have access to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <IconUser className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">
                        {member.userName || 'Unknown User'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.userEmail || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {member.role === 'owner' ? (
                      <RoleBadge role={member.role} />
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(
                          value: 'owner' | 'admin' | 'member' | 'viewer',
                        ) => handleUpdateRole(member.userId, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{' '}
                              {member.userName || member.userEmail} from this
                              workspace?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.userId)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
