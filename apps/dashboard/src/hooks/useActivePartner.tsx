import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserPartners, usePartnerCapabilities, UserPartner } from './useUserPartners';

const STORAGE_KEY = 'traverum_active_partner_id';

interface ActivePartnerContextType {
  activePartner: UserPartner | null;
  activePartnerId: string | null;
  setActivePartnerId: (id: string) => void;
  capabilities: {
    isSupplier: boolean;
    isHotel: boolean;
    experienceCount: number;
    hasHotelConfig: boolean;
  };
  isLoading: boolean;
  userPartners: UserPartner[];
  hasMultiplePartners: boolean;
}

const ActivePartnerContext = createContext<ActivePartnerContextType | undefined>(undefined);

export function ActivePartnerProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userPartners, defaultPartner, hasMultiplePartners, isLoading: partnersLoading } = useUserPartners();
  
  // Get initial partner ID from URL, localStorage, or default
  const getInitialPartnerId = (): string | null => {
    // First check URL
    const urlPartnerId = searchParams.get('partner');
    if (urlPartnerId) return urlPartnerId;
    
    // Then check localStorage
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) return storedId;
    
    // Finally use default
    return defaultPartner?.partner_id || null;
  };

  const [activePartnerId, setActivePartnerIdState] = useState<string | null>(null);

  // Initialize active partner when user partners load
  useEffect(() => {
    if (!partnersLoading && userPartners.length > 0) {
      const initialId = getInitialPartnerId();
      // Validate that the stored ID is still accessible
      const validPartner = userPartners.find(up => up.partner_id === initialId);
      if (validPartner && initialId !== activePartnerId) {
        setActivePartnerIdState(initialId);
        // Update URL to match
        const newParams = new URLSearchParams(searchParams);
        newParams.set('partner', initialId);
        setSearchParams(newParams, { replace: true });
      } else if (!validPartner && defaultPartner && !activePartnerId) {
        // Fall back to default if stored ID is invalid
        setActivePartnerIdState(defaultPartner.partner_id);
        // Update URL to match
        const newParams = new URLSearchParams(searchParams);
        newParams.set('partner', defaultPartner.partner_id);
        setSearchParams(newParams, { replace: true });
      }
    } else if (!partnersLoading && userPartners.length === 0 && activePartnerId) {
      // Clear active partner if no partners available
      setActivePartnerIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [partnersLoading, userPartners, defaultPartner]);

  // Get capabilities for the active partner
  const { data: capabilities, isLoading: capabilitiesLoading, isFetching: capabilitiesFetching } = usePartnerCapabilities(activePartnerId);

  // Set active partner and persist
  const setActivePartnerId = (id: string) => {
    setActivePartnerIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    
    // Always update URL parameter
    const newParams = new URLSearchParams(searchParams);
    newParams.set('partner', id);
    setSearchParams(newParams, { replace: true });
  };

  // Find the active partner object
  const activePartner = userPartners.find(up => up.partner_id === activePartnerId) || null;

  const value: ActivePartnerContextType = {
    activePartner,
    activePartnerId,
    setActivePartnerId,
    capabilities: capabilities || {
      isSupplier: false,
      isHotel: false,
      experienceCount: 0,
      hasHotelConfig: false,
    },
    isLoading: partnersLoading || capabilitiesLoading || capabilitiesFetching,
    userPartners,
    hasMultiplePartners,
  };

  return (
    <ActivePartnerContext.Provider value={value}>
      {children}
    </ActivePartnerContext.Provider>
  );
}

export function useActivePartner() {
  const context = useContext(ActivePartnerContext);
  if (context === undefined) {
    throw new Error('useActivePartner must be used within an ActivePartnerProvider');
  }
  return context;
}
