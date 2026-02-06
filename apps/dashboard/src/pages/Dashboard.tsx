import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { EmptyCanvas } from '@/components/EmptyCanvas';

/**
 * Smart dashboard redirect component.
 * Redirects to the appropriate dashboard based on partner capabilities.
 * Shows empty canvas if user has no organizations.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { capabilities, isLoading, activePartner, userPartners, activePartnerId } = useActivePartner();

  useEffect(() => {
    // Always wait for loading to complete - this includes capabilities loading
    if (isLoading) {
      return;
    }

    // If user has no organizations, show empty canvas (handled in render)
    if (userPartners.length === 0) {
      return;
    }

    // If no active partner selected, don't redirect yet
    if (!activePartner || !activePartnerId) {
      return;
    }

    // At this point, isLoading is false, so capabilities should be loaded
    // Redirect based on capabilities
    if (capabilities.isSupplier) {
      // Suppliers (including hybrid) go to supplier dashboard
      navigate('/supplier/dashboard', { replace: true });
    } else if (capabilities.isHotel) {
      // Hotel-only goes to hotel dashboard
      navigate('/hotel/dashboard', { replace: true });
    } else {
      // No capabilities yet - default to supplier (they can create experiences)
      navigate('/supplier/dashboard', { replace: true });
    }
  }, [capabilities, isLoading, activePartner, activePartnerId, userPartners.length, navigate]);

  // Show loading while determining where to go
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show empty canvas if user has no organizations
  if (userPartners.length === 0) {
    return <EmptyCanvas />;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
