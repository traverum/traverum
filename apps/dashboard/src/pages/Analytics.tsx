import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VIEW_STORAGE_KEY = 'traverum_active_view';

export default function Analytics() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/analytics') return;

    let savedView = 'experiences';
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'experiences' || stored === 'stays') savedView = stored;
    } catch {}

    navigate(
      savedView === 'stays' ? '/hotel/analytics' : '/supplier/analytics',
      { replace: true }
    );
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
