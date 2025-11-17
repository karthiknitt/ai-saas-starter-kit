'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft, IconBuilding, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name must be less than 50 characters'),
  plan: z.enum(['Free', 'Pro', 'Startup']),
});

type UpdateWorkspaceValues = z.infer<typeof updateWorkspaceSchema>;

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerId: string;
}

/**
 * Workspace settings page for owners and admins.
 * Allows updating workspace name, plan, and deleting workspace.
 */
export default function WorkspaceSettingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<UpdateWorkspaceValues>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: '',
      plan: 'Free',
    },
  });

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const response = await fetch(`/api/workspaces?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.workspaces && data.workspaces.length > 0) {
            const ws = data.workspaces[0];
            setWorkspace(ws);
            form.reset({
              name: ws.name,
              plan: ws.plan,
            });
          }
        }
      } catch (_error) {
        toast.error('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      void fetchWorkspace();
    }
  }, [slug, form]);

  async function onSubmit(values: UpdateWorkspaceValues) {
    if (!workspace) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update workspace');
      }

      toast.success('Workspace updated successfully');

      // If slug changed, redirect to new slug
      if (data.workspace.slug !== slug) {
        router.push(`/workspace/${data.workspace.slug}/settings`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update workspace',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!workspace) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete workspace');
      }

      toast.success('Workspace deleted successfully');
      router.push('/dashboard/workspaces');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete workspace',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <p className="text-center text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/workspace/${slug}`}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace configuration
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconBuilding className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Update workspace name and plan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Workspace Name
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Inc."
                          {...field}
                          disabled={isSubmitting}
                          aria-required="true"
                        />
                      </FormControl>
                      <FormDescription>
                        This is your workspace&apos;s display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Plan
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger aria-required="true">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Free">
                            <div className="flex flex-col">
                              <span className="font-medium">Free</span>
                              <span className="text-xs text-muted-foreground">
                                10 AI requests/month
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Pro">
                            <div className="flex flex-col">
                              <span className="font-medium">Pro</span>
                              <span className="text-xs text-muted-foreground">
                                1,000 AI requests/month
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Startup">
                            <div className="flex flex-col">
                              <span className="font-medium">Startup</span>
                              <span className="text-xs text-muted-foreground">
                                Unlimited AI requests
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your current workspace plan.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <IconTrash className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete this workspace
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete a workspace, there is no going back. Please be
              certain.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <IconTrash className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Workspace'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the workspace &quot;{workspace.name}&quot; and remove all
                    associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Workspace
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
