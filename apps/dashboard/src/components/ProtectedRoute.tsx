import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  useLayout?: boolean;
}

export function ProtectedRoute({ children, useLayout = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Don't use layout for auth-related pages
  const noLayoutRoutes = ['/auth', '/verify-email', '/onboarding'];
  const shouldUseLayout = useLayout && !noLayoutRoutes.some(route => location.pathname.startsWith(route));

  if (shouldUseLayout) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return <>{children}</>;
}
