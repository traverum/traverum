import { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { OrganizationDropdown } from './OrganizationDropdown';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { useSupplierData } from '@/hooks/useSupplierData';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  ClockIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Bars3Icon,
  ChevronLeftIcon,
  MapPinIcon,
  CodeBracketIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { capabilities, activePartner, isLoading, activePartnerId } = useActivePartner();
  const { isOpen, toggle, open } = useSidebar();
  
  // Get data for supplier
  const { experiences } = capabilities.isSupplier ? useSupplierData() : { experiences: [] };
  const { requests: pendingRequests } = usePendingRequests();
  
  // Get upcoming sessions count
  const { data: upcomingSessionsCount = 0 } = useQuery({
    queryKey: ['upcomingSessionsCount', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId || !capabilities.isSupplier || experiences.length === 0) return 0;
      
      const experienceIds = experiences.map(e => e.id);
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('experience_sessions')
        .select('*', { count: 'exact', head: true })
        .in('experience_id', experienceIds)
        .gte('session_date', today)
        .neq('session_status', 'cancelled');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!activePartnerId && capabilities.isSupplier && experiences.length > 0,
  });

  if (isLoading || !activePartner) {
    return null;
  }

  const isExperienceActive = (experienceId: string) => {
    return location.pathname === `/supplier/experiences/${experienceId}` ||
           location.pathname === `/supplier/experiences/${experienceId}/sessions` ||
           location.pathname === `/supplier/experiences/${experienceId}/edit`;
  };

  return (
    <>
      {/* Toggle Button - Outside when closed */}
      {!isOpen && (
        <button
          onClick={toggle}
          className="fixed top-3 left-3 z-50 p-1.5 bg-background border border-border rounded-md shadow-sm hover:bg-accent transition-all duration-200"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-4 w-4 text-foreground" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[224px] bg-background border-r border-border flex flex-col transition-transform duration-200 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Section: Close Button + Organization Dropdown */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-border">
          <button
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-accent transition-colors flex-shrink-0"
            aria-label="Close sidebar"
          >
            <ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <OrganizationDropdown />
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-2 flex flex-col">
          <div className="flex-1 space-y-2">
            {/* Home */}
            <NavLink
              to={capabilities.isHotel ? '/hotel/dashboard' : '/supplier/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                  'hover:bg-accent',
                  isActive || location.pathname === '/supplier/dashboard' || location.pathname === '/hotel/dashboard'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <HomeIcon className="h-4 w-4 flex-shrink-0" />
              <span>Home</span>
            </NavLink>

            {/* Calendar Section */}
            {capabilities.isSupplier && (
              <NavLink
                to="/supplier/sessions"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">Calendar</span>
                {upcomingSessionsCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {upcomingSessionsCount > 99 ? '99+' : upcomingSessionsCount}
                  </span>
                )}
              </NavLink>
            )}

            {/* Pending Requests Section */}
            {capabilities.isSupplier && (
              <NavLink
                to="/supplier/requests"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">Pending Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                    {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
                  </span>
                )}
              </NavLink>
            )}

            {/* Experiences Section */}
            {capabilities.isSupplier && (
              <>
                <div className="flex items-center justify-between px-2 py-1 mt-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Experiences
                  </h3>
                  {experiences.length > 0 && (
                    <button
                      onClick={() => navigate('/supplier/experiences')}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      See all
                    </button>
                  )}
                </div>
                {experiences.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No experiences yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {experiences.map((experience) => {
                      const isActive = isExperienceActive(experience.id);
                      return (
                        <button
                          key={experience.id}
                          onClick={() => navigate(`/supplier/experiences/${experience.id}`)}
                          className={cn(
                            'w-full flex items-center gap-2 h-7 px-2 rounded-md text-sm transition-colors text-left',
                            'hover:bg-accent',
                            isActive
                              ? 'bg-accent text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span className="flex-1 truncate">{experience.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Hotel navigation */}
            {capabilities.isHotel && (
              <>
                <NavLink
                  to="/hotel/selection"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                      'hover:bg-accent',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Experience Selection</span>
                </NavLink>
                <NavLink
                  to="/hotel/location"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                      'hover:bg-accent',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Location Settings</span>
                </NavLink>
                <NavLink
                  to="/hotel/customize"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                      'hover:bg-accent',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  <PaintBrushIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Widget Style</span>
                </NavLink>
                <NavLink
                  to="/hotel/embed"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                      'hover:bg-accent',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  <CodeBracketIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Embed Widget</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Analytics - Bottom */}
          <div className="pt-2 border-t border-border mt-auto">
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 h-7 px-2 rounded-md text-sm font-medium transition-colors',
                  'hover:bg-accent',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <ChartBarIcon className="h-4 w-4 flex-shrink-0" />
              <span>Analytics</span>
            </NavLink>
          </div>
        </nav>
        
        {/* Add Organization (if needed) */}
        {children}
      </aside>
    </>
  );
}
