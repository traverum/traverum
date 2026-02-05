import { useNavigate } from 'react-router-dom';
import { useSupplierData } from '@/hooks/useSupplierData';
import { useActivePartner } from '@/hooks/useActivePartner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ExperiencesList() {
  const navigate = useNavigate();
  const { isLoading: partnerLoading } = useActivePartner();
  const { experiences, isLoading } = useSupplierData();

  if (partnerLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'draft':
        return 'bg-warning';
      case 'archive':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">All Experiences</h1>
        </div>

        {/* Experiences List */}
        {experiences.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="p-12 text-center">
              <div className="mb-4">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No experiences yet
              </h3>
              <p className="text-sm text-secondary mb-6">
                Create your first experience to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {experiences.map((experience) => {
              const status = experience.experience_status || 'draft';
              const coverImage = (experience as any).cover_url || experience.image_url;
              
              return (
                <Card
                  key={experience.id}
                  className="border border-border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => navigate(`/supplier/experiences/${experience.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={experience.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-3xl">✨</span>
                        </div>
                      )}
                      {/* Status Badge */}
                      <Badge
                        className={cn(
                          'absolute top-2 right-2 text-xs font-medium',
                          getStatusColor(status)
                        )}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    
                    {/* Title */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {experience.title}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
