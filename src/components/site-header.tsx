import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from './ui/modetoggle';
import { ThemeSelector } from './theme-selector';
import { SignoutButton } from './forms/signout';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

interface SiteHeaderProps {
  user?: User | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          {user && (
            <p className="text-muted-foreground text-sm">
              Welcome, {user.name}!
            </p>
          )}
          <h1 className="text-base font-medium">Dashboard</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeToggle />
          <SignoutButton className="min-w-[100px]" />
        </div>
      </div>
    </header>
  );
}
