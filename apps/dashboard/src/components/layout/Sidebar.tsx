import { ReactNode, useEffect, useState } from 'react';
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
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { PanelLeft, HelpCircle, Settings } from 'lucide-react';
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
  
  const { experiences, refetchExperiences } = useSupplierData();
  const { requests: pendingRequests } = usePendingRequests();
  const [creatingExperience, setCreatingExperience] = useState(false);
  const [creatingStay, setCreatingStay] = useState(false);

  const [experiencesOpen, setExperiencesOpen] = useState(() => {
    try { return localStorage.getItem('sidebar-experiences') !== 'false'; } catch { return true; }
  });
  const [staysOpen, setStaysOpen] = useState(() => {
    try { return localStorage.getItem('sidebar-stays') !== 'false'; } catch { return true; }
  });

  const toggleExperiences = () => {
    const next = !experiencesOpen;
    setExperiencesOpen(next);
    try { localStorage.setItem('sidebar-experiences', String(next)); } catch {}
  };
  const toggleStays = () => {
    const next = !staysOpen;
    setStaysOpen(next);
    try { localStorage.setItem('sidebar-stays', String(next)); } catch {}
  };

  // When navigating to supplier or hotel area, expand only that section and collapse the other
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/supplier')) {
      setExperiencesOpen(true);
      setStaysOpen(false);
      try {
        localStorage.setItem('sidebar-experiences', 'true');
        localStorage.setItem('sidebar-stays', 'false');
      } catch {}
    } else if (path.startsWith('/hotel')) {
      setStaysOpen(true);
      setExperiencesOpen(false);
      try {
        localStorage.setItem('sidebar-stays', 'true');
        localStorage.setItem('sidebar-experiences', 'false');
      } catch {}
    }
  }, [location.pathname]);

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
        <nav className="flex-1 overflow-y-auto px-2 py-2 flex flex-col">
          <div className="flex-1">
            {/* Home — utility link, visually lighter */}
            <NavLink
              to="/dashboard"
              className={() =>
                cn(
                  'flex items-center h-7 px-2 rounded-md text-sm transition-colors',
                  'hover:bg-accent',
                  location.pathname === '/dashboard'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <span>Home</span>
            </NavLink>

            {/* ── Experiences section ── */}
            <div className="mt-5">
                {/* Section header — Notion style: icon visible, chevron + actions on hover */}
                <div className="group flex items-center h-7 px-1 rounded-md hover:bg-accent/50 transition-colors">
                  <button
                    onClick={toggleExperiences}
                    className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                    aria-label={experiencesOpen ? 'Collapse Experiences' : 'Expand Experiences'}
                  >
                    <ChevronRightIcon className={cn(
                      'h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-150',
                      experiencesOpen && 'rotate-90'
                    )} />
                    <HomeIcon className={cn(
                      'h-4 w-4 text-muted-foreground absolute group-hover:opacity-0 transition-opacity duration-150',
                      location.pathname === '/supplier/dashboard' && 'text-foreground'
                    )} />
                  </button>
                  <button
                    onClick={() => navigate('/supplier/dashboard')}
                    className={cn(
                      'flex-1 text-left text-sm font-medium transition-colors truncate ml-1',
                      location.pathname === '/supplier/dashboard'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Experiences
                  </button>
                </div>

                {/* Collapsible content — one continuous list (Notion-style) */}
                {experiencesOpen && (
                  <div className="mt-1.5 space-y-px">
                    <NavLink
                      to="/supplier/sessions"
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md text-sm font-medium transition-colors',
                          'hover:bg-accent',
                          isActive
                            ? 'bg-accent text-foreground'
                            : 'text-foreground/90 hover:text-foreground'
                        )
                      }
                    >
                      <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate">Calendar</span>
                      {upcomingSessionsCount > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {upcomingSessionsCount > 99 ? '99+' : upcomingSessionsCount}
                        </span>
                      )}
                    </NavLink>

                    <NavLink
                      to="/supplier/bookings"
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md text-sm font-medium transition-colors',
                          'hover:bg-accent',
                          isActive
                            ? 'bg-accent text-foreground'
                            : 'text-foreground/90 hover:text-foreground'
                        )
                      }
                    >
                      <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate">Bookings</span>
                      {pendingRequests.length > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                          {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
                        </span>
                      )}
                    </NavLink>

                    <NavLink
                      to="/supplier/analytics"
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md text-sm font-medium transition-colors',
                          'hover:bg-accent',
                          isActive
                            ? 'bg-accent text-foreground'
                            : 'text-foreground/90 hover:text-foreground'
                        )
                      }
                    >
                      <ChartBarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate">Analytics</span>
                    </NavLink>

                    {/* Subtle separation + link to See all experiences */}
                    <div className="mt-2.5 pt-0.5">
                      <button
                        onClick={() => navigate('/supplier/experiences')}
                        className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 hover:text-foreground pl-3 pb-1 text-left transition-colors w-full"
                      >
                        Your experiences
                      </button>
                    </div>
                    {experiences.length > 0 ? (
                      experiences.map((experience) => {
                        const isActive = isExperienceActive(experience.id);
                        return (
                          <button
                            key={experience.id}
                            onClick={() => navigate(`/supplier/experiences/${experience.id}`)}
                            className={cn(
                              'w-full flex items-center h-8 pl-3 pr-2 rounded-md text-sm transition-colors text-left',
                              'hover:bg-accent',
                              isActive
                                ? 'bg-accent text-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span className="flex-1 min-w-0 truncate">{experience.title}</span>
                          </button>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => navigate('/supplier/experiences')}
                        className="w-full flex items-center h-8 pl-3 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
                      >
                        <span className="flex-1 min-w-0 truncate">No experiences yet</span>
                      </button>
                    )}
                    <button
                      onClick={handleAddExperience}
                      disabled={creatingExperience}
                      className={cn(
                        'w-full flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left',
                        creatingExperience && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <PlusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{creatingExperience ? 'Adding...' : 'New experience'}</span>
                    </button>
                  </div>
                )}
              </div>

            {/* ── Stays section ── */}
            <div className="mt-5">
                {/* Section header */}
                <div className="group flex items-center h-7 px-1 rounded-md hover:bg-accent/50 transition-colors">
                  <button
                    onClick={toggleStays}
                    className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                    aria-label={staysOpen ? 'Collapse Stays' : 'Expand Stays'}
                  >
                    <ChevronRightIcon className={cn(
                      'h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-150',
                      staysOpen && 'rotate-90'
                    )} />
                    <HomeIcon className={cn(
                      'h-4 w-4 text-muted-foreground absolute group-hover:opacity-0 transition-opacity duration-150',
                      location.pathname === '/hotel/dashboard' && 'text-foreground'
                    )} />
                  </button>
                  <button
                    onClick={() => navigate('/hotel/dashboard')}
                    className={cn(
                      'flex-1 text-left text-sm font-medium transition-colors truncate ml-1',
                      location.pathname === '/hotel/dashboard'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Stays
                  </button>
                </div>

                {/* Collapsible content — one continuous list (Notion-style) */}
                {staysOpen && (
                  <div className="mt-1.5 space-y-px">
                    <NavLink
                      to="/hotel/analytics"
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md text-sm font-medium transition-colors',
                          'hover:bg-accent',
                          isActive
                            ? 'bg-accent text-foreground'
                            : 'text-foreground/90 hover:text-foreground'
                        )
                      }
                    >
                      <ChartBarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate">Analytics</span>
                    </NavLink>

                    {/* Subtle separation + link to See all properties (same as Experiences) */}
                    <div className="mt-2.5 pt-0.5">
                      <button
                        onClick={() => navigate('/hotel/stays')}
                        className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 hover:text-foreground pl-3 pb-1 text-left transition-colors w-full"
                      >
                        Your properties
                      </button>
                    </div>
                    {hotelConfigs.length > 0 ? (
                      hotelConfigs.map((config) => {
                        const isActive = location.pathname === `/hotel/stays/${config.id}`;
                        return (
                          <button
                            key={config.id}
                            onClick={() => {
                              setActiveHotelConfigId(config.id);
                              navigate(`/hotel/stays/${config.id}`);
                            }}
                            className={cn(
                              'w-full flex items-center h-8 pl-3 pr-2 rounded-md text-sm transition-colors text-left',
                              'hover:bg-accent',
                              isActive
                                ? 'bg-accent text-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span className="flex-1 min-w-0 truncate">{config.display_name || config.slug}</span>
                          </button>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => navigate('/hotel/stays')}
                        className="w-full flex items-center h-8 pl-3 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left"
                      >
                        <span className="flex-1 min-w-0 truncate">No properties yet</span>
                      </button>
                    )}

                    <button
                      onClick={handleAddStay}
                      disabled={creatingStay}
                      className={cn(
                        'w-full flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left',
                        creatingStay && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <PlusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{creatingStay ? 'Adding...' : 'New property'}</span>
                    </button>

                  </div>
                )}
              </div>
            </div>
        </nav>

        {/* Bottom: Settings + Support */}
        <div className="border-t border-border px-2 py-2 flex-shrink-0 space-y-px">
          <NavLink
            to="/settings"
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
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
          <NavLink
            to="/support"
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
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            <span>Support</span>
          </NavLink>
        </div>

        {children}
      </aside>
    </>
  );
}
