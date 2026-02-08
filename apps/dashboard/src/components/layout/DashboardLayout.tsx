import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, activePartner } = useActivePartner();
  const { isOpen } = useSidebar();

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
        'flex-1 min-h-screen transition-all duration-200',
        isOpen ? 'ml-[224px]' : 'ml-0'
      )}>
        {children}
      </main>
    </div>
  );
}
