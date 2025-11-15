import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-[var(--nav-active)]',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-[var(--interactive-hover)]',
        destructive:
          'border-transparent bg-[var(--status-error)] text-[var(--status-error-fg)] [a&]:hover:bg-[var(--status-error)]/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        success:
          'border-transparent bg-[var(--status-success)] text-[var(--status-success-fg)] [a&]:hover:bg-[var(--status-success)]/90',
        warning:
          'border-transparent bg-[var(--status-warning)] text-[var(--status-warning-fg)] [a&]:hover:bg-[var(--status-warning)]/90',
        info: 'border-transparent bg-[var(--status-info)] text-[var(--status-info-fg)] [a&]:hover:bg-[var(--status-info)]/90',
        outline:
          'text-foreground [a&]:hover:bg-[var(--interactive-hover)] [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
