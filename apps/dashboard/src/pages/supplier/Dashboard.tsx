import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useSupplierData } from '@/hooks/useSupplierData';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { activePartner, isLoading: partnerLoading, activePartnerId } = useActivePartner();
  const {
    experiences,
    isLoading: supplierLoading,
  } = useSupplierData();
  const { requests: pendingRequests, isLoading: requestsLoading } = usePendingRequests();

  // Get all upcoming sessions
  const { data: upcomingSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['upcomingSessions', activePartnerId, experiences.length],
    queryFn: async () => {
      if (!activePartnerId || experiences.length === 0) return [];
      
      const experienceIds = experiences.map(e => e.id);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('experience_sessions')
        .select(`
          *,
          experience:experiences!sessions_experience_fk(
            id,
            title,
            image_url
          )
        `)
        .in('experience_id', experienceIds)
        .gte('session_date', today)
        .neq('session_status', 'cancelled')
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activePartnerId && experiences.length > 0 && !supplierLoading,
  });

  if (partnerLoading || supplierLoading || !activePartner) {
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

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'dd.MM');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // "10:00:00" -> "10:00"
  };

  // Only show loading if query is actually enabled and loading
  const isSessionsLoading = sessionsLoading && !!activePartnerId && experiences.length > 0 && !supplierLoading;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
        </div>

        {/* Pending Requests Section - Always visible */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Pending Requests</h2>
          </div>
          {requestsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 w-[280px] bg-muted animate-pulse rounded-sm flex-shrink-0" />
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-secondary">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {pendingRequests.slice(0, 6).map((request) => {
                const deadline = parseISO(request.response_deadline);
                const isUrgent = deadline.getTime() - Date.now() < 12 * 60 * 60 * 1000;
                const timeUntil = formatDistanceToNow(deadline, { addSuffix: true });
                
                return (
                  <Card
                    key={request.id}
                    className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[280px]"
                    onClick={() => navigate('/supplier/requests')}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                              {request.experience.title}
                            </h3>
                            <p className="text-xs text-secondary mt-1">
                              {request.guest_name}
                            </p>
                          </div>
                          {isUrgent && (
                            <Badge className="h-4 px-1.5 text-xs bg-destructive text-destructive-foreground flex-shrink-0 rounded-full">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-secondary">
                          <span>{request.participants} {request.participants === 1 ? 'guest' : 'guests'}</span>
                          <span>·</span>
                          <span>€{(request.total_cents / 100).toFixed(0)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {timeUntil}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {pendingRequests.length > 6 && (
                <Card
                  className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[120px] flex items-center justify-center"
                  onClick={() => navigate('/supplier/requests')}
                >
                  <CardContent className="p-4 text-center">
                    <ChevronRight className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-secondary">
                      {pendingRequests.length - 6} more
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Sessions Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-foreground">Upcoming Sessions</h2>
            <button
              onClick={() => navigate('/supplier/sessions')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View calendar
            </button>
          </div>
          {upcomingSessions.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-secondary">No upcoming sessions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {upcomingSessions.map((session: any) => (
                  <Card
                    key={session.id}
                    className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[200px]"
                    onClick={() => navigate(`/supplier/sessions/${session.id}`)}
                  >
                    <CardContent className="p-3">
                      <h3 className="text-sm font-medium text-foreground">
                        {formatDateLabel(session.session_date)} @ {formatTime(session.start_time)}
                      </h3>
                      <p className="text-xs text-secondary mt-1 truncate">
                        {session.experience?.title || 'Experience'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Fade overlay on right */}
              <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
