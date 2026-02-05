import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function EmptyCanvas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mb-8 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Add Your First Business
        </h2>
        <p className="text-sm text-secondary mb-8">
          Start by adding your business to get started
        </p>
        <Button
          onClick={() => navigate('/onboarding/add-business')}
          className="h-7 px-3"
        >
          Add Your First Business
        </Button>
      </div>
    </div>
  );
}
