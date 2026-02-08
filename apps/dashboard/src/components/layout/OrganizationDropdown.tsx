import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AddHotelProperty } from '@/components/AddHotelProperty';

export function OrganizationDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const {
    activePartner,
    activePartnerId,
    setActivePartnerId,
    userPartners,
    capabilities,
  } = useActivePartner();
  const { activeHotelConfigId, setActiveHotelConfigId, activeHotelConfig } = useActiveHotelConfig();

  const [showAddProperty, setShowAddProperty] = useState(false);

  // Fetch all hotel configs for ALL user's partner IDs in one query
  const partnerIds = userPartners.map(up => up.partner_id);
  const { data: allHotelConfigs = [] } = useQuery({
    queryKey: ['allHotelConfigs', ...partnerIds],
    queryFn: async () => {
      if (partnerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('hotel_configs')
        .select('id, partner_id, slug, display_name, is_active')
        .in('partner_id', partnerIds)
        .order('created_at', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: partnerIds.length > 0,
  });

  if (!activePartner) {
    return null;
  }

  // Determine current view context from route
  const isSupplierView = location.pathname.startsWith('/supplier');
  const isHotelView = location.pathname.startsWith('/hotel');

  // Context label for the trigger button
  const getContextLabel = (): string | null => {
    if (isSupplierView) return 'Experiences';
    if (isHotelView && activeHotelConfig) return activeHotelConfig.display_name || activeHotelConfig.slug;
    return null;
  };

  const contextLabel = getContextLabel();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleExperiencesClick = (partnerId: string) => {
    if (partnerId !== activePartnerId) {
      setActivePartnerId(partnerId);
    }
    navigate('/supplier/dashboard');
  };

  const handleHotelPropertyClick = (partnerId: string, hotelConfigId: string) => {
    if (partnerId !== activePartnerId) {
      setActivePartnerId(partnerId);
    }
    setActiveHotelConfigId(hotelConfigId);
    navigate('/hotel/dashboard');
  };

  const handleAddProperty = (partnerId: string) => {
    if (partnerId !== activePartnerId) {
      setActivePartnerId(partnerId);
    }
    setShowAddProperty(true);
  };

  // Always show "Experiences" entry for every org — enables organic growth
  // (a hotel org can navigate here to create their first experience)
  const orgShowsExperiences = (_up: typeof userPartners[0]) => true;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-2 px-3 hover:bg-accent transition-ui"
          >
            <div className="flex-1 min-w-0 text-left">
              <span className="font-medium text-sm text-foreground truncate block">
                {activePartner.partner.name}
              </span>
              {contextLabel && (
                <span className="text-xs text-muted-foreground truncate block">
                  {contextLabel}
                </span>
              )}
            </div>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {userPartners.map((up, idx) => {
            const orgHotelConfigs = allHotelConfigs.filter(hc => hc.partner_id === up.partner_id);
            const isActiveOrg = up.partner_id === activePartnerId;
            const showExperiences = orgShowsExperiences(up);

            return (
              <div key={up.id}>
                {idx > 0 && <DropdownMenuSeparator />}

                {/* Org Header */}
                <DropdownMenuLabel className="text-xs font-semibold text-foreground px-2 py-1.5 uppercase tracking-wider">
                  {up.partner.name}
                </DropdownMenuLabel>

                {/* Experiences entry */}
                {showExperiences && (
                  <DropdownMenuItem
                    onClick={() => handleExperiencesClick(up.partner_id)}
                    className={cn(
                      'cursor-pointer px-2 py-1.5 pl-4 flex items-center justify-between',
                      isActiveOrg && isSupplierView && 'bg-accent'
                    )}
                  >
                    <span className="text-sm">
                      Experiences
                    </span>
                    {isActiveOrg && isSupplierView && (
                      <CheckIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                )}

                {/* Hotel properties */}
                {orgHotelConfigs.map(hc => {
                  const isActiveProperty = isActiveOrg && isHotelView && activeHotelConfigId === hc.id;
                  return (
                    <DropdownMenuItem
                      key={hc.id}
                      onClick={() => handleHotelPropertyClick(up.partner_id, hc.id)}
                      className={cn(
                        'cursor-pointer px-2 py-1.5 pl-4 flex items-center justify-between',
                        isActiveProperty && 'bg-accent'
                      )}
                    >
                      <span className="text-sm truncate">
                        {hc.display_name || hc.slug}
                      </span>
                      {isActiveProperty && (
                        <CheckIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}

                {/* Add Hotel Property */}
                <DropdownMenuItem
                  onClick={() => handleAddProperty(up.partner_id)}
                  className="cursor-pointer px-2 py-1.5 pl-4 text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <PlusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    Add Hotel Property
                  </span>
                </DropdownMenuItem>
              </div>
            );
          })}

          <DropdownMenuSeparator />

          {/* New Organization */}
          <DropdownMenuItem
            onClick={() => navigate('/onboarding/add-business')}
            className="cursor-pointer px-2 py-1.5"
          >
            <span className="flex items-center gap-2 text-sm">
              <PlusIcon className="h-4 w-4 flex-shrink-0" />
              New Organization
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign out */}
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-destructive focus:text-destructive px-2 py-1.5"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Hotel Property Dialog */}
      <AddHotelProperty
        open={showAddProperty}
        onOpenChange={setShowAddProperty}
      />
    </>
  );
}
