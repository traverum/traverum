import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useCreateOrganization } from '@/hooks/useCreateOrganization';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

type BusinessType = 'supplier' | 'hotel' | 'hybrid';

interface BusinessDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessType: BusinessType;
  onBack: () => void;
}

const businessDetailsSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email(),
  city: z.string().optional(),
  country: z.string().optional(),
  // Supplier fields
  businessEntityType: z.string().optional(),
  taxId: z.string().optional(),
  // Hotel fields
  hotelName: z.string().optional(),
  slug: z.string().optional(),
  displayName: z.string().optional(),
});

export function BusinessDetails({
  open,
  onOpenChange,
  businessType,
  onBack,
}: BusinessDetailsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createOrganization, isLoading } = useCreateOrganization();

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    city: '',
    country: '',
    businessEntityType: '',
    taxId: '',
    hotelName: '',
    slug: '',
    displayName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugError, setSlugError] = useState<string>('');

  // Auto-generate slug from hotel name
  useEffect(() => {
    if (businessType === 'hotel' || businessType === 'hybrid') {
      const generatedSlug = formData.hotelName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.hotelName, businessType]);

  // For hybrid, hotel name should match business name if not set
  useEffect(() => {
    if (businessType === 'hybrid' && !formData.hotelName && formData.name) {
      setFormData((prev) => ({ ...prev, hotelName: prev.name }));
    }
  }, [formData.name, businessType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSlugError('');

    try {
      // Validate based on business type
      const validationData: any = {
        name: formData.name,
        email: formData.email,
        city: formData.city || undefined,
        country: formData.country || undefined,
      };

      if (businessType === 'supplier' || businessType === 'hybrid') {
        validationData.businessEntityType = formData.businessEntityType || undefined;
        validationData.taxId = formData.taxId || undefined;
      }

      if (businessType === 'hotel' || businessType === 'hybrid') {
        validationData.hotelName = formData.hotelName || formData.name;
        validationData.slug = formData.slug;
        validationData.displayName = formData.displayName || formData.hotelName || formData.name;
      }

      businessDetailsSchema.parse(validationData);

      // Validate slug format
      if (businessType === 'hotel' || businessType === 'hybrid') {
        if (!formData.slug || formData.slug.length < 3) {
          setSlugError('Slug must be at least 3 characters');
          return;
        }
        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
          setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
          return;
        }
      }

      const result = await createOrganization({
        businessType,
        name: formData.name,
        email: formData.email,
        city: formData.city || undefined,
        country: formData.country || undefined,
        businessEntityType: formData.businessEntityType || undefined,
        taxId: formData.taxId || undefined,
        hotelName: businessType === 'hotel' || businessType === 'hybrid' 
          ? (formData.hotelName || formData.name) 
          : undefined,
        slug: businessType === 'hotel' || businessType === 'hybrid' 
          ? formData.slug 
          : undefined,
        displayName: businessType === 'hotel' || businessType === 'hybrid' 
          ? (formData.displayName || formData.hotelName || formData.name) 
          : undefined,
      });

      if (result.error) {
        if (result.error.message.includes('slug')) {
          setSlugError('This slug is already taken. Please choose another.');
        } else {
          toast({
            title: 'Could not create business',
            description: result.error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Business created',
          description: 'Your business has been set up successfully.',
        });
        // Redirect will happen via useCreateOrganization hook
        // Don't close dialog here, let the redirect handle it
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const isHotel = businessType === 'hotel' || businessType === 'hybrid';
  const isSupplier = businessType === 'supplier' || businessType === 'hybrid';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border border-border rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Business Details
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Business/Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Supplier Fields */}
          {isSupplier && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="businessEntityType">Business Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Individual, Company, LLC, etc.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={formData.businessEntityType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, businessEntityType: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Optional. You can add this later.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxId: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Hotel Fields */}
          {isHotel && (
            <>
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="slug">
                    Hotel Slug <span className="text-destructive">*</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Used in your widget URL (e.g., book.traverum.com/your-slug)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
            </>
          )}

          <div className="flex justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="h-7 px-3"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-7 px-3"
            >
              {isLoading ? 'Creating...' : 'Create Business'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
