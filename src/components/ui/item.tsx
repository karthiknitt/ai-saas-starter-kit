import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Renders a vertical list wrapper for grouping item rows.
 *
 * @returns A `div` element with `role="list"`, `data-slot="item-group"`, applied group layout classes, and any forwarded props.
 */
function ItemGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn('group/item-group flex flex-col', className)}
      {...props}
    />
  );
}

/**
 * Render a horizontal item separator with standardized slot and spacing.
 *
 * @param className - Additional CSS class names appended to the default spacing.
 * @returns The Separator element with `data-slot="item-separator"`, horizontal orientation, and merged classes.
 */
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn('my-0', className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  'group/item flex items-center border border-transparent text-sm rounded-md transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-border',
        muted: 'bg-muted/50',
      },
      size: {
        default: 'p-4 gap-4 ',
        sm: 'py-3 px-4 gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * Renders an item container with configurable visual `variant` and `size`.
 *
 * The component applies styling and data attributes for composition and forwards any other props to the rendered element.
 *
 * @param className - Additional CSS classes to apply to the root element
 * @param variant - Visual variant to apply (`default`, `outline`, or `muted`)
 * @param size - Size variant to apply (`default` or `sm`)
 * @param asChild - When `true`, render the provided child element instead of a `div`
 * @returns The rendered item element (a `div` or the provided child) with variant/size styling and composition attributes
 */
function Item({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  );
}

const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image:
          'size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Renders a media container for an item with selectable visual variants.
 *
 * @param variant - Visual style of the media. `"default"` applies no special styling, `"icon"` styles the container for icon-sized SVGs, and `"image"` styles the container for image content (sizing and cover behavior).
 * @returns A div element with `data-slot="item-media"` and `data-variant` set to `variant`, styled according to the selected variant and merged `className`.
 */
function ItemMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

/**
 * Renders a content container for an item with layout-related classes and a `data-slot="item-content"` marker.
 *
 * @returns A `div` element that serves as the item's main content area, applying flex layout, gap spacing, and any supplied `className` or other div props.
 */
function ItemContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        'flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the item's title slot with typography and layout classes.
 *
 * @returns A `div` element for the item title slot with the applied className and forwarded props.
 */
function ItemTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        'flex w-fit items-center gap-2 text-sm leading-snug font-medium',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a paragraph used for an item's description with clamped lines and link styling.
 *
 * The element includes default typography, a two-line clamp, balanced text flow, and anchor styles; any provided `className` is merged with these defaults and all other props are forwarded to the underlying `p` element.
 *
 * @param className - Additional class names to merge with the component's default styles
 * @returns A `p` element with item description styling and forwarded props
 */
function ItemDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a right-aligned horizontal container for action controls within an item.
 *
 * @param className - Additional class names appended to the default "flex items-center gap-2" classes.
 * @param props - Remaining props are forwarded to the underlying `div` element.
 * @returns A `div` element that groups item action controls with consistent spacing and alignment.
 */
function ItemActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-actions"
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}

/**
 * Renders a header container for an item row with horizontal layout and spacing.
 *
 * @returns A `div` element marked with `data-slot="item-header"` that applies header layout classes and forwards any additional props.
 */
function ItemHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        'flex basis-full items-center justify-between gap-2',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the footer region for an item row.
 *
 * The element is a container styled for horizontal layout, spacing, and alignment and forwards any native div props.
 *
 * @returns A `div` element with `data-slot="item-footer"` and classes for flex layout, full basis, centered alignment, space-between justification, and gap.
 */
function ItemFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        'flex basis-full items-center justify-between gap-2',
        className,
      )}
      {...props}
    />
  );
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};
