import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';

export default function Analytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const { capabilities, isLoading } = useActivePartner();

  useEffect(() => {
    if (isLoading) return;
    if (location.pathname !== '/analytics') return;

    const target = capabilities.isSupplier
      ? '/supplier/analytics'
      : '/hotel/analytics';

    navigate(target, { replace: true });
  }, [location.pathname, navigate, capabilities, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
