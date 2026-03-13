import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useSidebar } from '@/contexts/SidebarContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BusinessDetails } from '@/pages/onboarding/BusinessDetails';
import { useSupplierData } from '@/hooks/useSupplierData';
import { useSupplierAnalytics } from '@/hooks/useSupplierAnalytics';
import { useHotelCommission } from '@/hooks/useHotelCommission';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, Building2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { open: openSidebar } = useSidebar();
  const { isLoading, activePartner, userPartners, capabilities } = useActivePartner();
  const { experiences, isLoading: supplierLoading } = useSupplierData();
  const { guestsServedCount = 0, isLoading: analyticsLoading } = useSupplierAnalytics();
  const { travelersGuidedCount = 0, isLoading: commissionLoading } = useHotelCommission();
  const { hotelConfigs, isLoading: configLoading } = useActiveHotelConfig();

  const showExperiences = capabilities.isSupplier;
  const showStays = capabilities.isHotel;
  const dataLoading = supplierLoading || configLoading || (showExperiences && analyticsLoading) || (showStays && commissionLoading);

  if (isLoading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (userPartners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BusinessDetails open={true} onOpenChange={() => {}} />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const partnerName = activePartner?.partner.name ?? '';

  const goToSection = (path: string) => {
    openSidebar();
    navigate(path);
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-8">
          <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">

            {/* Greeting + stat */}
            <div className="pt-2 pb-8 animate-fade-in">
              <h1 className="text-2xl font-semibold text-foreground">
                {getGreeting()}
                {partnerName ? `, ${partnerName}` : ''}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                What do you want to manage today?
              </p>
              {(showExperiences || showStays) && (guestsServedCount > 0 || travelersGuidedCount > 0) && (
                <p className="text-sm text-muted-foreground/80 mt-2">
                  {showExperiences && guestsServedCount > 0 && (
                    <span>You&apos;ve served {guestsServedCount} guest{guestsServedCount !== 1 ? 's' : ''}</span>
                  )}
                  {showExperiences && showStays && guestsServedCount > 0 && travelersGuidedCount > 0 && ' · '}
                  {showStays && travelersGuidedCount > 0 && (
                    <span>You&apos;ve guided {travelersGuidedCount} traveler{travelersGuidedCount !== 1 ? 's' : ''} to local experiences</span>
                  )}
                </p>
              )}
            </div>

            {/* ── Experiences section ── */}
            {showExperiences && (
              <section className="mb-8 animate-fade-in">
                <button
                  type="button"
                  onClick={() => goToSection('/supplier/dashboard')}
                  className="flex items-center gap-2 mb-3 text-left transition-ui hover:opacity-80 cursor-pointer"
                >
                  <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                    Experiences
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {experiences.length}
                  </span>
                </button>

                {experiences.length === 0 ? (
                  <Card className="border border-border">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No experiences yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="relative -mx-1">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                      {experiences.map((experience) => {
                        const exp = experience as { id: string; title: string; cover_url?: string; image_url?: string | null };
                        const coverSrc = exp.cover_url || exp.image_url;

                        return (
                          <Card
                            key={exp.id}
                            className="rounded-xl border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[240px] overflow-hidden"
                            onClick={() => goToSection('/supplier/dashboard')}
                          >
                            <CardContent className="p-0">
                              <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-b-xl">
                                {coverSrc ? (
                                  <img
                                    src={coverSrc}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Compass className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                  </div>
                )}
              </section>
            )}

            {/* ── Properties section ── */}
            {showStays && (
              <section className="mb-8 animate-fade-in" style={showExperiences ? { animationDelay: '75ms' } : undefined}>
                <button
                  type="button"
                  onClick={() => goToSection('/hotel/dashboard')}
                  className="flex items-center gap-2 mb-3 text-left transition-ui hover:opacity-80 cursor-pointer"
                >
                  <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                    Properties
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {hotelConfigs.length}
                  </span>
                </button>

                {hotelConfigs.length === 0 ? (
                  <Card className="border border-border">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No properties yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="relative -mx-1">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                      {hotelConfigs.map((config) => {
                        const cfg = config as { id: string; display_name: string; logo_url?: string | null };
                        const logoSrc = cfg.logo_url;

                        return (
                          <Card
                            key={cfg.id}
                            className="rounded-xl border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[200px] overflow-hidden"
                            onClick={() => goToSection('/hotel/dashboard')}
                          >
                            <CardContent className="p-0">
                              <div className="relative aspect-[4/3] overflow-hidden bg-muted/50 flex items-center justify-center p-6 rounded-b-xl">
                                {logoSrc ? (
                                  <img
                                    src={logoSrc}
                                    alt=""
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <Building2 className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                  </div>
                )}
              </section>
            )}

            {!showExperiences && !showStays && (
              <p className="text-sm text-muted-foreground animate-fade-in">
                No areas to manage yet. Complete onboarding to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
