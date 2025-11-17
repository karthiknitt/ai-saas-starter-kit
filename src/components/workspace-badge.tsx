import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkspaceBadgeProps {
  plan: string;
  className?: string;
}

/**
 * Badge component for displaying workspace plan tier.
 * Shows different colors based on plan type.
 *
 * @param plan - Workspace plan (Free, Pro, Startup)
 * @param className - Optional CSS classes
 */
export function WorkspaceBadge({ plan, className }: WorkspaceBadgeProps) {
  const planLower = plan.toLowerCase();

  const variant =
    planLower === 'startup'
      ? 'default'
      : planLower === 'pro'
        ? 'secondary'
        : 'outline';

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {plan}
    </Badge>
  );
}
