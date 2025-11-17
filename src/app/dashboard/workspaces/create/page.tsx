'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft, IconBuilding } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name must be less than 50 characters'),
  plan: z.enum(['Free', 'Pro', 'Startup']),
});

type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>;

/**
 * Workspace creation page with form for setting up new workspaces.
 * Allows users to specify workspace name and plan.
 */
export default function CreateWorkspacePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      plan: 'Free',
    },
  });

  async function onSubmit(values: CreateWorkspaceValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create workspace');
      }

      toast.success('Workspace created successfully');
      router.push(`/workspace/${data.workspace.slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create workspace',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard/workspaces">
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspaces
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Workspace
        </h1>
        <p className="text-muted-foreground mt-2">
          Set up a new workspace for your team
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconBuilding className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Workspace Details</CardTitle>
              <CardDescription>
                Choose a name and plan for your workspace
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      This will be the name of your workspace. Choose something
                      memorable.
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
                      defaultValue={field.value}
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
                      Select the plan that best fits your needs. You can upgrade
                      later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
