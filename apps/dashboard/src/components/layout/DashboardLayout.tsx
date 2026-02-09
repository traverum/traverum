import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, activePartner } = useActivePartner();
  const { isOpen, toggle } = useSidebar();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No active partner (e.g. new user with no organizations yet)
  // Render children directly without sidebar — the child component handles its own empty state
  if (!activePartner) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Notion-style Sidebar */}
      <Sidebar />

      {/* Main Content Area - Clean and Focused */}
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-200 relative',
        isOpen ? 'ml-[224px]' : 'ml-0'
      )}>
        {/* Sidebar Toggle Button - Top-left when closed */}
        {!isOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="fixed top-4 left-4 z-50 h-8 w-8"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        {children}
      </main>
    </div>
  );
}
