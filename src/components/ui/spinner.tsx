import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Renders an accessible spinning loader icon.
 *
 * The component forwards all standard SVG props to the underlying icon and merges any
 * provided `className` with the default sizing and spin classes.
 *
 * @param className - Additional CSS classes to apply to the icon
 * @param props - Other SVG attributes forwarded to the icon element
 * @returns The spinner SVG element with `role="status"` and `aria-label="Loading"`
 */
function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
