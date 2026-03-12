import { useActivePartner } from '@/hooks/useActivePartner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BusinessDetails } from '@/pages/onboarding/BusinessDetails';

export default function Dashboard() {
  const { isLoading, activePartner, userPartners } = useActivePartner();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
          <p className="text-muted-foreground">
            Welcome to {activePartner?.partner.name ?? 'your dashboard'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
