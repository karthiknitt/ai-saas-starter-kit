import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Container for empty-state content.
 *
 * Renders a div element intended as an empty-state wrapper and applies any standard div props and provided `className`.
 *
 * @returns A div element serving as the empty-state container.
 */
function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a centered header container for empty-state content.
 *
 * @returns A div element with data-slot="empty-header" and merged class names for layout and alignment
 */
function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Renders the media/icon area for an empty state.
 *
 * @param className - Additional CSS classes appended to the component's root element
 * @param variant - Visual variant to apply; `'default'` produces a transparent background, `'icon'` applies the styled icon variant
 * @returns The div element used as the empty-state media container
 */
function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

/**
 * Renders the title area for an empty state.
 *
 * @param props - Standard div props; `className` will be merged with default typography classes.
 * @returns A div element with `data-slot="empty-title"` and default title typography applied.
 */
function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-lg font-medium tracking-tight', className)}
      {...props}
    />
  );
}

/**
 * Renders the description block used in empty-state layouts.
 *
 * Applies muted text styling, relaxed small text sizing, and underline/link hover styles to descendant anchors.
 *
 * @returns The rendered description element for empty states.
 */
function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the content area for an empty state.
 *
 * The element is a div with data-slot="empty-content" and default layout and typography classes;
 * any provided props (including `className`) are applied to the element.
 *
 * @returns A div element used as the empty-state content container with merged classes and forwarded props.
 */
function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};