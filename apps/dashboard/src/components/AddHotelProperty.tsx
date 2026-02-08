import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateHotelProperty } from '@/hooks/useCreateHotelProperty';
import { useToast } from '@/hooks/use-toast';

interface AddHotelPropertyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddHotelProperty({ open, onOpenChange }: AddHotelPropertyProps) {
  const { createHotelProperty, isLoading } = useCreateHotelProperty();
  const { toast } = useToast();
  const [hotelName, setHotelName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hotelName.trim() || hotelName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const result = await createHotelProperty({
      hotelName: hotelName.trim(),
    });

    if (result.error) {
      toast({
        title: 'Could not add hotel property',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Hotel property added',
        description: 'Your hotel property has been added successfully.',
      });
      setHotelName('');
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Hotel Property
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hotelName">Hotel Name</Label>
            <Input
              id="hotelName"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="e.g. Lakeside Resort"
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHotelName('');
                setError('');
                onOpenChange(false);
              }}
              disabled={isLoading}
              className="h-7 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hotelName.trim()}
              className="h-7 px-3"
            >
              {isLoading ? 'Adding...' : 'Add Property'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
