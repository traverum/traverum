import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateOrganization } from '@/hooks/useCreateOrganization';
import { useToast } from '@/hooks/use-toast';

interface BusinessDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessDetails({ open, onOpenChange }: BusinessDetailsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createOrganization, isLoading } = useCreateOrganization();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    if (!name || name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    const result = await createOrganization({
      name: name.trim(),
      email: user?.email || '',
    });

    if (result.error) {
      toast({
        title: 'Could not create organization',
        description: result.error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Name your organization
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
              required
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-7 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="h-7 px-3"
            >
              {isLoading ? 'Creating...' : 'Get Started'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
