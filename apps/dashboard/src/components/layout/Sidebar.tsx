import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { OrganizationDropdown } from './OrganizationDropdown';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { useSupplierData } from '@/hooks/useSupplierData';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { getTodayLocal, isSessionUpcoming } from '@/lib/date-utils';
import {
  HomeIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { PanelLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activePartner, isLoading, activePartnerId } = useActivePartner();
  const { hotelConfigs, setActiveHotelConfigId } = useActiveHotelConfig();
  const { isOpen, toggle } = useSidebar();
  const queryClient = useQueryClient();
  
  // Always call useSupplierData (no conditional hook) — it handles empty state internally
  const { experiences, refetchExperiences } = useSupplierData();
  const { requests: pendingRequests } = usePendingRequests();
  const [creatingExperience, setCreatingExperience] = useState(false);
  const [creatingStay, setCreatingStay] = useState(false);

  // Determine current view context purely from route — no capability gating
  const isSupplierContext = location.pathname.startsWith('/supplier');
  const isHotelContext = location.pathname.startsWith('/hotel');

  const handleAddExperience = async () => {
    if (creatingExperience || !activePartnerId) return;
    setCreatingExperience(true);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .insert({
          partner_id: activePartnerId,
          title: 'New Experience',
          slug: 'new-experience-' + Date.now(),
          description: '',
          duration_minutes: 60,
          max_participants: 10,
          price_cents: 1,
          currency: 'EUR',
          experience_status: 'draft',
        })
        .select('id')
        .single();

      if (error) throw error;
      await refetchExperiences();
      queryClient.invalidateQueries({ queryKey: ['partnerCapabilities', activePartnerId] });
      navigate(`/supplier/experiences/${data.id}`);
    } catch (error) {
      console.error('Failed to create experience:', error);
    } finally {
      setCreatingExperience(false);
    }
  };

  const handleAddStay = async () => {
    if (creatingStay || !activePartnerId) return;
    setCreatingStay(true);
    try {
      const slug = 'new-stay-' + Date.now();
      const { data, error } = await supabase
        .from('hotel_configs')
        .insert({
          partner_id: activePartnerId,
          display_name: 'New Property',
          slug,
          is_active: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['hotelConfigs', activePartnerId] });
      queryClient.invalidateQueries({ queryKey: ['partnerCapabilities', activePartnerId] });
      setActiveHotelConfigId(data.id);
      navigate(`/hotel/stays/${data.id}`);
    } catch (error) {
      console.error('Failed to create property:', error);
    } finally {
      setCreatingStay(false);
    }
  };
  
  // Get upcoming sessions count (exclude sessions whose start time has already passed)
  const todayLocal = getTodayLocal();
  
  const { data: upcomingSessionsCount = 0 } = useQuery({
    queryKey: ['upcomingSessionsCount', activePartnerId, todayLocal],
    queryFn: async () => {
      if (!activePartnerId || experiences.length === 0) return 0;
      
      const experienceIds = experiences.map(e => e.id);
      
      const { data: sessions, error } = await supabase
        .from('experience_sessions')
        .select('session_date, start_time')
        .in('experience_id', experienceIds)
        .neq('session_status', 'cancelled')
        .gte('session_date', todayLocal);
      
      if (error) throw error;
      
      return (sessions || []).filter(s =>
        isSessionUpcoming(s.session_date, s.start_time)
      ).length;
    },
    enabled: !!activePartnerId && experiences.length > 0,
    refetchInterval: 60000,
    staleTime: 0,
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
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[224px] bg-background border-r border-border flex flex-col transition-transform duration-200 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Section: Toggle Button + Organization Dropdown */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-border">
          <button
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-accent transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
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
              to={isHotelContext ? '/hotel/dashboard' : '/supplier/dashboard'}
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

            {/* ── Supplier Navigation (Experiences view) ── */}
            {isSupplierContext && (
              <>
                {/* Calendar */}
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

                {/* Bookings */}
                <NavLink
                  to="/supplier/bookings"
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
                  <span className="flex-1">Bookings</span>
                  {pendingRequests.length > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                      {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
                    </span>
                  )}
                </NavLink>

                {/* Experiences List */}
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
                {experiences.length > 0 && (
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
                {experiences.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No experiences yet
                  </div>
                )}
                <button
                  onClick={handleAddExperience}
                  disabled={creatingExperience}
                  className={cn(
                    'w-full flex items-center gap-2 h-7 px-2 rounded-md text-xs transition-colors text-left mt-1',
                    'text-muted-foreground hover:text-foreground hover:bg-accent',
                    creatingExperience && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <PlusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{creatingExperience ? 'Adding...' : 'Add'}</span>
                </button>
              </>
            )}

            {/* ── Hotel Navigation (Stays view) ── */}
            {isHotelContext && (
              <>
                {/* Stays List */}
                <div className="flex items-center justify-between px-2 py-1 mt-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stays
                  </h3>
                  {hotelConfigs.length > 0 && (
                    <button
                      onClick={() => navigate('/hotel/stays')}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      See all
                    </button>
                  )}
                </div>
                {hotelConfigs.length > 0 && (
                  <div className="space-y-1">
                    {hotelConfigs.map((config) => {
                      const isActive = location.pathname === `/hotel/stays/${config.id}`;
                      return (
                        <button
                          key={config.id}
                          onClick={() => {
                            setActiveHotelConfigId(config.id);
                            navigate(`/hotel/stays/${config.id}`);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 h-7 px-2 rounded-md text-sm transition-colors text-left',
                            'hover:bg-accent',
                            isActive
                              ? 'bg-accent text-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span className="flex-1 truncate">{config.display_name || config.slug}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {hotelConfigs.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No properties yet
                  </div>
                )}
                <button
                  onClick={handleAddStay}
                  disabled={creatingStay}
                  className={cn(
                    'w-full flex items-center gap-2 h-7 px-2 rounded-md text-xs transition-colors text-left mt-1',
                    'text-muted-foreground hover:text-foreground hover:bg-accent',
                    creatingStay && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <PlusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{creatingStay ? 'Adding...' : 'Add'}</span>
                </button>
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
        
        {children}
      </aside>
    </>
  );
}
