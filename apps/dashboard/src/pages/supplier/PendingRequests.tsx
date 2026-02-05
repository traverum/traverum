import { usePendingRequests } from '@/hooks/usePendingRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { getLanguageName, getLanguageFlag } from '@/components/LanguageSelector';

export default function PendingRequests() {
  const { requests, isLoading } = usePendingRequests();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <h4 className="font-medium mb-2">No pending requests</h4>
              <p className="text-sm text-muted-foreground">
                When guests request a booking, you'll see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const deadline = parseISO(request.response_deadline);
              const isUrgent = deadline.getTime() - Date.now() < 12 * 60 * 60 * 1000; // Less than 12 hours

              return (
                <Card 
                  key={request.id} 
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{request.guest_name}</h4>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {request.experience.title}
                        </p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                          <span>{request.participants} {request.participants === 1 ? 'person' : 'people'}</span>
                          <span>€{(request.total_cents / 100).toFixed(0)}</span>
                          {(request as any).preferred_language && (
                            <span>{getLanguageFlag((request as any).preferred_language)} {getLanguageName((request as any).preferred_language)}</span>
                          )}
                          {request.is_request && request.requested_date && (
                            <span>
                              Requested: {format(parseISO(request.requested_date), 'dd/MM/yyyy')}
                              {request.requested_time && ` at ${request.requested_time.slice(0, 5)}`}
                            </span>
                          )}
                          {!request.is_request && request.session && (
                            <span>
                              Session: {format(parseISO(request.session.session_date), 'dd/MM/yyyy')} at {request.session.start_time.slice(0, 5)}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Respond within {formatDistanceToNow(deadline)}
                        </div>
                      </div>

                      <div className="flex gap-2 sm:flex-col">
                        <Button size="sm" className="flex-1 sm:flex-none">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
