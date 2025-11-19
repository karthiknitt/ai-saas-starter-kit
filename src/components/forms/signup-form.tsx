'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { signUp } from '../../../server/users';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard',
  });
};
export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsLoading(true);
    const { success, message } = await signUp(
      values.name,
      values.email,
      values.password,
    );

    if (success) {
      // Create Polar customer after successful signup
      try {
        // Note: Customer creation will happen when user logs in or accesses subscription features
        // This keeps the signup flow fast and doesn't block on external service calls
        console.log(
          'User signed up successfully, Polar customer will be created when first accessing subscriptions',
        );
      } catch (error) {
        console.error('Error during signup process:', error);
        // Don't block signup flow for Polar errors
      }

      toast.success(
        `${message as string} Please check your email for verification`,
      );
      router.push('/dashboard');
    } else {
      toast.error(message as string);
    }
    setIsLoading(false);
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Login with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={signInWithGoogle}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-labelledby="google-title"
                    >
                      <title id="google-title">Google</title>
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    Login with Google
                  </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or Continue to Sign Up with
                  </span>
                </div>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="User's Name" {...field} />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" {...field} />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex flex-col gap-2">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>{' '}
                            {/* Fix typo here */}
                            <FormControl>
                              <Input
                                placeholder="********"
                                {...field}
                                type="password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <a
                        href="/forgot-password"
                        className="ml-auto items-center text-sm underline-offset-4"
                      >
                        Forgot your password?
                      </a>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-label="Creating account..."
                      />
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <a href="/login" className="underline underline-offset-4">
                    Sign In
                  </a>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{' '}
        {/* biome-ignore lint/a11y/useValidAnchor: Placeholder link for legal documents */}
        <a href="#">Terms of Service</a> and{' '}
        {/* biome-ignore lint/a11y/useValidAnchor: Placeholder link for legal documents */}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
