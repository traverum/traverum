import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';

export default function HotelDashboard() {
  const navigate = useNavigate();
  const { activePartner, capabilities, isLoading: partnerLoading } = useActivePartner();

  if (partnerLoading || !activePartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
        </div>

        {/* Getting Started for new hotels */}
        {!capabilities.hasHotelConfig && (
          <div className="rounded-md border border-border bg-card p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Select experiences to showcase</h2>
            <button
              onClick={() => navigate('/hotel/selection')}
              className="h-7 px-3 text-sm font-medium rounded-[3px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Experiences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
