import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to smart dashboard that will determine the right landing page
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-semibold text-foreground mb-4">
          Veyond
        </h1>
        <p className="text-lg text-secondary mb-12">
          Where hotels and local experiences connect
        </p>
        <div className="flex justify-center">
          <Button 
            size="default"
            className="h-7 px-3 transition-ui"
            onClick={() => navigate('/auth')}
          >
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
