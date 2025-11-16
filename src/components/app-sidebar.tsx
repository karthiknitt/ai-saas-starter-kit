'use client';

import {
  IconApi,
  IconCamera,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReportAnalytics,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconTimeline,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react';
import * as React from 'react';

import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { PERMISSIONS, roleHasPermission } from '@/lib/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

const defaultUser = {
  name: 'Guest',
  email: 'guest@example.com',
  avatar: '/avatars/guest.jpg',
};

// Navigation items with permission requirements
const ALL_NAV_ITEMS = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: IconDashboard,
    requiredPermission: null, // Available to all authenticated users
    items: [
      {
        title: 'Analytics',
        url: '/dashboard/analytics',
      },
      {
        title: 'Sessions',
        url: '/dashboard/sessions',
      },
      {
        title: 'Subscriptions',
        url: '/dashboard/subscriptions',
      },
    ],
  },
  {
    title: 'AI Chat',
    url: '/aichat',
    icon: IconFileAi,
    requiredPermission: null, // Available to all authenticated users
  },
  {
    title: 'Billing',
    url: '/billing',
    icon: IconCreditCard,
    requiredPermission: PERMISSIONS.BILLING_READ,
  },
  {
    title: 'API Docs',
    url: '/api-docs',
    icon: IconApi,
    requiredPermission: PERMISSIONS.API_KEYS_READ,
  },
  {
    title: 'Projects',
    url: '#',
    icon: IconFolder,
    requiredPermission: null,
  },
  {
    title: 'Team',
    url: '#',
    icon: IconUsersGroup,
    requiredPermission: PERMISSIONS.USERS_READ,
  },
  {
    title: 'Admin',
    url: '/admin',
    icon: IconShieldLock,
    requiredPermission: PERMISSIONS.ADMIN_ACCESS,
    items: [
      {
        title: 'Users',
        url: '/admin/users',
        requiredPermission: PERMISSIONS.USERS_READ,
      },
      {
        title: 'Audit Logs',
        url: '/admin/audit-logs',
        requiredPermission: PERMISSIONS.AUDIT_VIEW,
      },
    ],
  },
];

const navSecondaryItems = [
  {
    title: 'Settings',
    url: '#',
    icon: IconSettings,
    requiredPermission: PERMISSIONS.SETTINGS_READ,
  },
  {
    title: 'Get Help',
    url: '#',
    icon: IconHelp,
    requiredPermission: null,
  },
  {
    title: 'Search',
    url: '#',
    icon: IconSearch,
    requiredPermission: null,
  },
];

const documentItems = [
  {
    name: 'Data Library',
    url: '#',
    icon: IconDatabase,
  },
  {
    name: 'Reports',
    url: '#',
    icon: IconReportAnalytics,
  },
  {
    name: 'Word Assistant',
    url: '#',
    icon: IconFileWord,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User | null;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [userRole, setUserRole] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await authClient.getSession();
        const role = (session.data?.user as User)?.role as string | undefined;
        if (!cancelled) setUserRole(role || 'viewer');
      } catch {
        if (!cancelled) setUserRole('viewer');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentUser = user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.image || '/avatars/default.jpg',
      }
    : defaultUser;

  // Filter navigation items based on user permissions
  const filteredNavItems = React.useMemo(() => {
    if (!userRole) return [];

    return ALL_NAV_ITEMS.filter((item) => {
      // If no permission required, show the item
      if (!item.requiredPermission) return true;
      // Check if user has the required permission
      return roleHasPermission(userRole, item.requiredPermission);
    }).map((item) => {
      // If item has sub-items, filter them based on permissions
      if (item.items) {
        const filteredSubItems = item.items.filter((subItem) => {
          if (!('requiredPermission' in subItem) || !subItem.requiredPermission)
            return true;
          return roleHasPermission(
            userRole,
            subItem.requiredPermission as string,
          );
        });
        return { ...item, items: filteredSubItems };
      }
      return item;
    });
  }, [userRole]);

  // Filter secondary navigation items based on permissions
  const filteredSecondaryItems = React.useMemo(() => {
    if (!userRole) return [];

    return navSecondaryItems.filter((item) => {
      if (!item.requiredPermission) return true;
      return roleHasPermission(userRole, item.requiredPermission);
    });
  }, [userRole]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
        <NavDocuments items={documentItems} />
        <NavSecondary items={filteredSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
