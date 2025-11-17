import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: 'owner' | 'admin' | 'member' | 'viewer';
  className?: string;
}

/**
 * Badge component for displaying user roles within a workspace.
 * Shows different colors based on role level.
 *
 * @param role - User role (owner, admin, member, viewer)
 * @param className - Optional CSS classes
 */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  const variant =
    role === 'owner' ? 'default' : role === 'admin' ? 'secondary' : 'outline';

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {role}
    </Badge>
  );
}
