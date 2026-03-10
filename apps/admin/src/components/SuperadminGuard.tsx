import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuperadminGuardProps {
  children: React.ReactNode;
}

export function SuperadminGuard({ children }: SuperadminGuardProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isSuperadmin, isLoading: superadminLoading } = useSuperadmin();
  const location = useLocation();

  if (authLoading || (user && superadminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm">
          <ShieldX className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            This area is restricted to Traverum administrators.
          </p>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
