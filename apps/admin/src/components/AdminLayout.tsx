import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  CreditCard,
  LogOut,
  Shield,
  MessageSquare,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/payouts', icon: CreditCard, label: 'Payouts' },
  { to: '/partners', icon: Building2, label: 'Partners' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/support-feedback', icon: MessageSquare, label: 'Support' },
];

export function AdminLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border flex flex-col bg-background">
        <div className="p-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-foreground">Traverum Admin</span>
        </div>

        <Separator />

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-ui',
                  isActive
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground truncate px-1">
            {user?.email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
