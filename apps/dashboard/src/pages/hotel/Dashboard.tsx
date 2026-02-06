import { useActivePartner } from '@/hooks/useActivePartner';

export default function HotelDashboard() {
  const { activePartner, isLoading: partnerLoading } = useActivePartner();

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
      <div className="max-w-5xl mx-auto">
        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
        </div>
      </div>
    </div>
  );
}
