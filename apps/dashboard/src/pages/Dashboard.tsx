import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { BusinessDetails } from '@/pages/onboarding/BusinessDetails';

type BusinessType = 'supplier' | 'hotel';

const VIEW_STORAGE_KEY = 'traverum_active_view';

/**
 * Smart dashboard redirect component.
 * Redirects based on saved view preference (Experiences or Stays).
 * Shows inline onboarding if user has no organizations.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoading, activePartner, userPartners, activePartnerId } = useActivePartner();
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (userPartners.length === 0) return;
    if (!activePartner || !activePartnerId) return;

    // Redirect based on saved view preference, default to experiences
    let savedView = 'experiences';
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'experiences' || stored === 'stays') savedView = stored;
    } catch {}

    if (savedView === 'stays') {
      navigate('/hotel/dashboard', { replace: true });
    } else {
      navigate('/supplier/dashboard', { replace: true });
    }
  }, [isLoading, activePartner, activePartnerId, userPartners.length, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Inline onboarding for users with no organizations
  if (userPartners.length === 0) {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    };

    const handleCardClick = (type: BusinessType) => {
      setSelectedType(type);
      setShowDetails(true);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-lg animate-fade-in">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            {getGreeting()}
          </h1>
          <p className="text-sm text-secondary mb-8">
            What would you like to manage?
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Experiences Card */}
            <button
              onClick={() => handleCardClick('supplier')}
              className="group border border-border rounded-md p-6 text-center transition-ui hover:bg-accent/50 cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">Experiences</h3>
              <p className="text-sm text-muted-foreground">
                Tours, activities, guides
              </p>
            </button>

            {/* Stays Card */}
            <button
              onClick={() => handleCardClick('hotel')}
              className="group border border-border rounded-md p-6 text-center transition-ui hover:bg-accent/50 cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">Stays</h3>
              <p className="text-sm text-muted-foreground">
                Hotels, resorts, B&Bs
              </p>
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            You can always add more later.
          </p>
        </div>

        {/* Business Details Dialog */}
        {selectedType && (
          <BusinessDetails
            open={showDetails}
            onOpenChange={(open) => {
              if (!open) {
                setShowDetails(false);
                setSelectedType(null);
              }
            }}
            businessType={selectedType}
            onBack={() => {
              setShowDetails(false);
              setSelectedType(null);
            }}
          />
        )}
      </div>
    );
  }

  // Loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
