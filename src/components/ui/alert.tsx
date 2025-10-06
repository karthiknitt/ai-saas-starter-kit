import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-[var(--status-error-fg)] bg-[var(--status-error)]/10 border-[var(--status-error)] [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--status-error-fg)]/90',
        success:
          'text-[var(--status-success-fg)] bg-[var(--status-success)]/10 border-[var(--status-success)] [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--status-success-fg)]/90',
        warning:
          'text-[var(--status-warning-fg)] bg-[var(--status-warning)]/10 border-[var(--status-warning)] [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--status-warning-fg)]/90',
        info: 'text-[var(--status-info-fg)] bg-[var(--status-info)]/10 border-[var(--status-info)] [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--status-info-fg)]/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
