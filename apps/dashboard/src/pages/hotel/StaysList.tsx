import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function StaysList() {
  const navigate = useNavigate();
  const { isLoading: partnerLoading } = useActivePartner();
  const { hotelConfigs, isLoading: configLoading, setActiveHotelConfigId } = useActiveHotelConfig();

  if (partnerLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handlePropertyClick = (configId: string) => {
    setActiveHotelConfigId(configId);
    navigate(`/hotel/stays/${configId}`);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">All Properties</h1>
        </div>

        {/* Properties List */}
        {hotelConfigs.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="p-6 text-center">
              <span className="text-sm text-muted-foreground">No properties yet</span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotelConfigs.map((config) => (
              <Card
                key={config.id}
                className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50"
                onClick={() => handlePropertyClick(config.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
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
        )}
      </div>
    </div>
  );
}
