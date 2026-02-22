import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useSupplierData } from '@/hooks/useSupplierData';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { ChevronRight, Compass, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getTodayLocal, isSessionUpcoming, parseLocalDate } from '@/lib/date-utils';
import { useUpcomingRentals } from '@/hooks/useUpcomingRentals';
import { toast } from 'sonner';

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
] as const;

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { activePartner, isLoading: partnerLoading, activePartnerId } = useActivePartner();
  const {
    experiences,
    isLoading: supplierLoading,
    hasStripe,
  } = useSupplierData();
  const { requests: pendingRequests, isLoading: requestsLoading } = usePendingRequests();
  const { rentals: upcomingRentals, isLoading: rentalsLoading } = useUpcomingRentals();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showCountryStep, setShowCountryStep] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  const handleConnectStripe = async () => {
    if (!selectedCountry) {
      setShowCountryStep(true);
      return;
    }

    setStripeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to connect Stripe');
        navigate('/auth?mode=login');
        return;
      }
      if (!activePartnerId) {
        toast.error('No organization selected');
        return;
      }

      await supabase
        .from('partners')
        .update({ country: selectedCountry })
        .eq('id', activePartnerId);

      const response = await supabase.functions.invoke('create-connect-account', {
        body: { origin: window.location.origin, partner_id: activePartnerId, country: selectedCountry },
      });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create Stripe account');
      }
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (error: any) {
      console.error('Stripe Connect error:', error);
      toast.error(error.message || 'Failed to connect Stripe');
      setStripeLoading(false);
    }
  };

  // Get all upcoming sessions (exclude sessions whose start time has already passed)
  const todayLocal = getTodayLocal();
  
  const { data: upcomingSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['upcomingSessions', activePartnerId, experiences.length, todayLocal],
    queryFn: async () => {
      if (!activePartnerId || experiences.length === 0) return [];
      
      const experienceIds = experiences.map(e => e.id);
      
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
        .neq('session_status', 'cancelled')
        .gte('session_date', todayLocal)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      const upcoming = (data || []).filter(s =>
        isSessionUpcoming(s.session_date, s.start_time)
      );
      
      return upcoming;
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
    return format(date, 'd.M.yyyy');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // "10:00:00" -> "10:00"
  };

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

  const formatRentalRange = (startDate: string, endDate: string) => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const sameYear = start.getFullYear() === end.getFullYear();
    const startFmt = sameYear ? format(start, 'd.M') : format(start, 'd.M.yyyy');
    return `${startFmt}–${format(end, 'd.M.yyyy')}`;
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
          <p className="text-sm text-muted-foreground mt-1.5">
            Craft moments that matter
          </p>
        </div>

        {/* Stripe onboarding */}
        {!hasStripe && (
          <Card className="border border-border">
            <CardContent className="p-4">
              {!showCountryStep ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Set up payments — Stripe handles everything securely
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConnectStripe}
                    disabled={stripeLoading}
                    className="h-7 flex-shrink-0"
                  >
                    Connect Stripe
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">
                      Where is your business registered?
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {EU_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleConnectStripe}
                      disabled={stripeLoading || !selectedCountry}
                      className="h-7 flex-shrink-0"
                    >
                      {stripeLoading ? 'Connecting...' : 'Continue'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Requests Section - Always visible */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-sm font-medium text-foreground">Pending Requests</h2>
          </div>
          {requestsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-[180px] bg-muted animate-pulse rounded-sm flex-shrink-0" />
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
                const requestedAgo = request.created_at
                  ? formatDistanceToNow(parseISO(request.created_at), { addSuffix: true })
                  : '—';
                return (
                  <Card
                    key={request.id}
                    className="border border-primary/30 bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[180px]"
                    onClick={() => navigate('/supplier/bookings?tab=requests')}
                  >
                    <CardContent className="p-3 flex flex-col gap-0.5">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                        {request.experience.title}
                      </h3>
                      <p className="text-xs text-secondary">{requestedAgo}</p>
                    </CardContent>
                  </Card>
                );
              })}
              {pendingRequests.length > 6 && (
                <Card
                  className="border border-primary/30 bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[100px] flex items-center justify-center"
                  onClick={() => navigate('/supplier/bookings?tab=requests')}
                >
                  <CardContent className="p-3 text-center">
                    <ChevronRight className="h-5 w-5 text-muted-foreground mx-auto mb-0.5" />
                    <p className="text-xs text-secondary">{pendingRequests.length - 6} more</p>
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
                {upcomingSessions.map((session: any) => {
                  const isActive = isToday(parseISO(session.session_date));
                  return (
                  <Card
                    key={session.id}
                    className={cn(
                      'bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[200px] border',
                      isActive ? 'border-success/30' : 'border-border'
                    )}
                    onClick={() => navigate(`/supplier/bookings?session=${session.id}`)}
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
                  );
                })}
              </div>
              {/* Fade overlay on right */}
              <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          )}
        </div>

        {/* Active & Upcoming Rentals — hidden when empty */}
        {upcomingRentals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium text-foreground">Active & Upcoming Rentals</h2>
              <button
                onClick={() => navigate('/supplier/sessions')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View calendar
              </button>
            </div>
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {upcomingRentals.map((rental) => {
                  const today = getTodayLocal();
                  const isActive = rental.rentalStartDate <= today && rental.rentalEndDate >= today;
                  return (
                  <Card
                    key={rental.reservationId}
                    className={cn(
                      'bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[200px] border',
                      isActive ? 'border-success/30' : 'border-border'
                    )}
                    onClick={() => navigate('/supplier/bookings?tab=upcoming')}
                  >
                    <CardContent className="p-3">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {rental.experience.title}
                      </h3>
                      <p className="text-xs text-secondary mt-1">
                        {formatRentalRange(rental.rentalStartDate, rental.rentalEndDate)}
                      </p>
                      <p className="text-xs text-secondary mt-0.5">
                        {rental.participants} {rental.participants === 1 ? 'unit' : 'units'}
                      </p>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
              <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Experiences Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-foreground">Experiences</h2>
            <button
              onClick={() => navigate('/supplier/experiences')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              See all
            </button>
          </div>
          {supplierLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 w-[240px] bg-muted animate-pulse rounded-sm flex-shrink-0" />
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-secondary">No experiences yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {experiences.slice(0, 6).map((experience) => {
                  const status = experience.experience_status || 'draft';
                  const coverImage = (experience as any).cover_url || experience.image_url;
                  
                  return (
                    <Card
                      key={experience.id}
                      className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[240px]"
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
                              <Compass className="h-6 w-6 text-muted-foreground" />
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
                          <h3 className="text-sm font-medium text-foreground line-clamp-2">
                            {experience.title}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {experiences.length > 6 && (
                  <Card
                    className="border border-border bg-card cursor-pointer transition-ui hover:bg-accent/50 flex-shrink-0 w-[120px] flex items-center justify-center"
                    onClick={() => navigate('/supplier/experiences')}
                  >
                    <CardContent className="p-4 text-center">
                      <ChevronRight className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-secondary">
                        {experiences.length - 6} more
                      </p>
                    </CardContent>
                  </Card>
                )}
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
