import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function HotelDashboard() {
  const navigate = useNavigate();
  const { activePartner, isLoading: partnerLoading } = useActivePartner();
  const { hotelConfigs, isLoading: configLoading, setActiveHotelConfigId } = useActiveHotelConfig();

  if (partnerLoading || configLoading || !activePartner) {
    return (
      <div className="flex items-center justify-center py-16">
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

  const handlePropertyClick = (configId: string) => {
    setActiveHotelConfigId(configId);
    navigate(`/hotel/stays/${configId}`);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="space-y-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
        </div>

        {/* Properties Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-foreground">Properties</h2>
            {hotelConfigs.length > 0 && (
              <button
                onClick={() => navigate('/hotel/stays')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                See all
              </button>
            )}
          </div>

          {hotelConfigs.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <span className="text-sm text-muted-foreground">No properties yet</span>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {hotelConfigs.map((config) => (
                  <Card
                    key={config.id}
                    className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[240px]"
                    onClick={() => handlePropertyClick(config.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2">
                          {config.display_name || config.slug}
                        </h3>
                        <Badge
                          className={cn(
                            'text-xs font-medium flex-shrink-0',
                            config.is_active ? 'bg-success' : 'bg-muted-foreground'
                          )}
                        >
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        /{config.slug}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Fade overlay on right */}
              {hotelConfigs.length > 3 && (
                <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
