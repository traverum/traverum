import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActivePartner } from './useActivePartner';

const STORAGE_KEY = 'traverum_active_hotel_config_id';

interface HotelConfig {
  id: string;
  partner_id: string;
  slug: string;
  display_name: string;
  is_active: boolean;
  [key: string]: any;
}

interface ActiveHotelConfigContextType {
  activeHotelConfig: HotelConfig | null;
  activeHotelConfigId: string | null;
  setActiveHotelConfigId: (id: string) => void;
  hotelConfigs: HotelConfig[];
  isLoading: boolean;
}

const ActiveHotelConfigContext = createContext<ActiveHotelConfigContextType | undefined>(undefined);

export function ActiveHotelConfigProvider({ children }: { children: ReactNode }) {
  const { activePartnerId } = useActivePartner();
  const [activeHotelConfigId, setActiveHotelConfigIdState] = useState<string | null>(null);

  // Fetch all hotel configs for the active partner
  // Always fetch when partner exists — don't gate on capabilities.isHotel
  // to avoid race conditions when switching orgs (capabilities load async)
  const { data: hotelConfigs = [], isLoading } = useQuery({
    queryKey: ['hotelConfigs', activePartnerId],
    queryFn: async (): Promise<HotelConfig[]> => {
      if (!activePartnerId) return [];

      const { data, error } = await supabase
        .from('hotel_configs')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching hotel configs:', error);
        return [];
      }

      return (data || []) as HotelConfig[];
    },
    enabled: !!activePartnerId,
  });

  // Initialize / auto-select active hotel config
  useEffect(() => {
    if (isLoading || hotelConfigs.length === 0) {
      if (!isLoading && hotelConfigs.length === 0) {
        setActiveHotelConfigIdState(null);
      }
      return;
    }

    // Check localStorage for a stored selection
    const storedId = localStorage.getItem(STORAGE_KEY);
    const storedIsValid = storedId && hotelConfigs.some(hc => hc.id === storedId);

    if (storedIsValid) {
      setActiveHotelConfigIdState(storedId);
    } else {
      // Auto-select first config
      const firstId = hotelConfigs[0].id;
      setActiveHotelConfigIdState(firstId);
      localStorage.setItem(STORAGE_KEY, firstId);
    }
  }, [isLoading, hotelConfigs, activePartnerId]);

  // Clear selection when partner changes
  useEffect(() => {
    // When partner changes, the hotelConfigs query will re-run
    // and the above effect will pick the correct config
  }, [activePartnerId]);

  const setActiveHotelConfigId = (id: string) => {
    setActiveHotelConfigIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const activeHotelConfig = hotelConfigs.find(hc => hc.id === activeHotelConfigId) || null;

  const value: ActiveHotelConfigContextType = {
    activeHotelConfig,
    activeHotelConfigId,
    setActiveHotelConfigId,
    hotelConfigs,
    isLoading,
  };

  return (
    <ActiveHotelConfigContext.Provider value={value}>
      {children}
    </ActiveHotelConfigContext.Provider>
  );
}

export function useActiveHotelConfig() {
  const context = useContext(ActiveHotelConfigContext);
  if (context === undefined) {
    throw new Error('useActiveHotelConfig must be used within an ActiveHotelConfigProvider');
  }
  return context;
}
