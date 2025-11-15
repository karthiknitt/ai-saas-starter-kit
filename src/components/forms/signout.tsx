'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export function SignoutButton({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function Logout() {
    setIsLoading(true);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('Logged Out Successfully');
          router.push('/login'); // redirect to login page
        },
      },
    });
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Button
        type="button"
        className="w-full"
        disabled={isLoading}
        onClick={Logout}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Logout ]->'}
      </Button>
    </div>
  );
}
