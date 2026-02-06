import { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState({
    hotelName: '',
    slug: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugError, setSlugError] = useState('');

  // Auto-generate slug from hotel name
  useEffect(() => {
    if (formData.hotelName && !formData.slug) {
      const slug = formData.hotelName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.hotelName]);

  // Auto-fill display name from hotel name
  useEffect(() => {
    if (formData.hotelName && !formData.displayName) {
      setFormData((prev) => ({ ...prev, displayName: formData.hotelName }));
    }
  }, [formData.hotelName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSlugError('');

    // Validation
    if (!formData.hotelName.trim()) {
      setErrors({ hotelName: 'Hotel name is required' });
      return;
    }

    if (!formData.slug.trim()) {
      setErrors({ slug: 'Slug is required' });
      return;
    }

    if (!formData.displayName.trim()) {
      setErrors({ displayName: 'Display name is required' });
      return;
    }

    const result = await createHotelProperty({
      hotelName: formData.hotelName,
      slug: formData.slug,
      displayName: formData.displayName,
    });

    if (result.error) {
      if (result.error.message.includes('slug')) {
        setSlugError('This slug is already taken. Please choose another.');
      } else {
        toast({
          title: 'Could not add hotel property',
          description: result.error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Hotel property added',
        description: 'Your hotel property has been added successfully.',
      });
      // Reset form
      setFormData({
        hotelName: '',
        slug: '',
        displayName: '',
      });
      setErrors({});
      setSlugError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Hotel Property
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hotelName">
              Hotel Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hotelName"
              value={formData.hotelName}
              onChange={(e) => setFormData((prev) => ({ ...prev, hotelName: e.target.value }))}
              disabled={isLoading}
              required
            />
            {errors.hotelName && (
              <p className="text-sm text-destructive">{errors.hotelName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Hotel Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setFormData((prev) => ({ ...prev, slug }));
              }}
              disabled={isLoading}
              required
            />
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used in your widget URL (e.g., book.traverum.com/your-slug)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
              disabled={isLoading}
              placeholder="How it appears in your widget"
              required
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({ hotelName: '', slug: '', displayName: '' });
                setErrors({});
                setSlugError('');
                onOpenChange(false);
              }}
              disabled={isLoading}
              className="h-7 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
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
