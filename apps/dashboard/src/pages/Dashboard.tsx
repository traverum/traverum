import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { BusinessDetails } from '@/pages/onboarding/BusinessDetails';

const VIEW_STORAGE_KEY = 'traverum_active_view';

/**
 * Smart dashboard redirect.
 * Routes based on partner capabilities: hotel-only partners go to hotel dashboard,
 * supplier-only partners go to supplier dashboard. Partners with both use saved preference.
 * Shows onboarding dialog if user has no organizations.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoading, activePartner, userPartners, activePartnerId, capabilities } = useActivePartner();

  useEffect(() => {
    if (isLoading) return;
    if (userPartners.length === 0) return;
    if (!activePartner || !activePartnerId) return;

    const { hasHotelConfig, experienceCount } = capabilities;
    const hotelOnly = hasHotelConfig && experienceCount === 0;
    const supplierOnly = experienceCount > 0 && !hasHotelConfig;

    let targetView: 'stays' | 'experiences';

    if (hotelOnly) {
      targetView = 'stays';
    } else if (supplierOnly) {
      targetView = 'experiences';
    } else {
      targetView = 'experiences';
      try {
        const stored = localStorage.getItem(VIEW_STORAGE_KEY);
        if (stored === 'experiences' || stored === 'stays') targetView = stored;
      } catch {}
    }

    try { localStorage.setItem(VIEW_STORAGE_KEY, targetView); } catch {}

    if (targetView === 'stays') {
      navigate('/hotel/dashboard', { replace: true });
    } else {
      navigate('/supplier/dashboard', { replace: true });
    }
  }, [isLoading, activePartner, activePartnerId, userPartners.length, capabilities, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (userPartners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BusinessDetails
          open={true}
          onOpenChange={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
