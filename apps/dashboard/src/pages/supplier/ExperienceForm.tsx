import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupplierData } from '@/hooks/useSupplierData';
import { useExperienceAvailability } from '@/hooks/useExperienceAvailability';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader, MediaItem } from '@/components/ImageUploader';
import { PricingType, PricingConfig, getPriceExamples } from '@/lib/pricing';
import { CategorySelector } from '@/components/CategorySelector';
import { FormSection } from '@/components/experience/FormSection';
import { AvailabilityEditor, defaultAvailability } from '@/components/experience/AvailabilityEditor';
import { CancellationPolicySelector, defaultCancellationPolicy } from '@/components/experience/CancellationPolicySelector';
import { CancellationPolicy, DEFAULT_WEEKDAYS, DEFAULT_START_TIME, DEFAULT_END_TIME } from '@/lib/availability';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { LanguageSelector } from '@/components/LanguageSelector';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1h' },
  { value: '90', label: '1h 30 min' },
  { value: '120', label: '2h' },
  { value: '150', label: '2h 30 min' },
  { value: '180', label: '3h' },
  { value: '240', label: '4h' },
  { value: '300', label: '5h' },
  { value: '360', label: '6h' },
  { value: '420', label: '7h' },
  { value: '480', label: 'All day' },
];

export default function ExperienceForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner, experiences, refetchExperiences } = useSupplierData();
  const { availability, saveAvailability } = useExperienceAvailability(id || null);

  const [loading, setLoading] = useState(false);
  
  // Section open states - all collapsed by default for compact view
  const [openSections, setOpenSections] = useState({
    basicInfo: false,
    location: false,
    pricing: false,
    availability: false,
    policies: false,
  });

  // Basic Info state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<MediaItem[]>([]);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  
  // Location state
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  
  // Pricing state
  const [pricingType, setPricingType] = useState<PricingType>('per_person');
  const [basePriceCents, setBasePriceCents] = useState('');
  const [includedParticipants, setIncludedParticipants] = useState('');
  const [extraPersonCents, setExtraPersonCents] = useState('');
  const [minParticipants, setMinParticipants] = useState('1');
  const [maxParticipants, setMaxParticipants] = useState('');

  // Availability state
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [validFrom, setValidFrom] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<string | null>(null);

  // Policy state
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('moderate');
  const [forceMajeureRefund, setForceMajeureRefund] = useState(true);
  const [allowsRequests, setAllowsRequests] = useState(true);

  // Load existing experience data when editing
  useEffect(() => {
    if (isEditing && experiences.length > 0) {
      const experience = experiences.find(e => e.id === id);
      if (experience) {
        // Basic info
        setTitle(experience.title);
        // Extract category from tags array (first element, for backwards compatibility)
        const tags = (experience as any).tags || [];
        setCategory(tags.length > 0 ? tags[0] : null);
        setDescription(experience.description);
        setDurationMinutes(experience.duration_minutes.toString());
        setMeetingPoint(experience.meeting_point || '');
        setAvailableLanguages((experience as any).available_languages || []);
        
        // Location
        const expLocationAddress = (experience as any).location_address || '';
        setLocationAddress(expLocationAddress);
        // If location exists, extract lat/lng from PostGIS POINT
        const expLocation = (experience as any).location;
        if (expLocation) {
          // Supabase returns PostGIS geography as string "POINT(lng lat)" or as GeoJSON object
          try {
            if (typeof expLocation === 'string') {
              // Parse "POINT(lng lat)" format
              const match = expLocation.match(/POINT\(([^ ]+) ([^ ]+)\)/);
              if (match) {
                setLocationLng(parseFloat(match[1]));
                setLocationLat(parseFloat(match[2]));
              }
            } else if (expLocation && typeof expLocation === 'object') {
              // Supabase might return as GeoJSON: { type: 'Point', coordinates: [lng, lat] }
              if ('coordinates' in expLocation && Array.isArray(expLocation.coordinates) && expLocation.coordinates.length >= 2) {
                setLocationLng(expLocation.coordinates[0]);
                setLocationLat(expLocation.coordinates[1]);
              } else if ('x' in expLocation && 'y' in expLocation) {
                // Alternative format: { x: lng, y: lat }
                setLocationLng(expLocation.x);
                setLocationLat(expLocation.y);
              }
            }
          } catch (e) {
            console.error('Error parsing location:', e);
          }
        }
        
        // Pricing
        const expPricingType = (experience as any).pricing_type || 'per_person';
        setPricingType(expPricingType);
        setBasePriceCents(((experience as any).base_price_cents / 100 || 0).toString());
        setIncludedParticipants(((experience as any).included_participants || 0).toString());
        setExtraPersonCents(((experience as any).extra_person_cents / 100 || experience.price_cents / 100).toString());
        setMinParticipants(((experience as any).min_participants || 1).toString());
        setMaxParticipants(experience.max_participants.toString());
        
        // Policies
        setCancellationPolicy((experience as any).cancellation_policy || 'moderate');
        setForceMajeureRefund((experience as any).force_majeure_refund ?? true);
        setAllowsRequests(experience.allows_requests ?? true);
        
        // Load images
        loadExistingImages(experience.id);
      }
    }
  }, [isEditing, id, experiences]);

  // Load availability when editing
  useEffect(() => {
    if (availability) {
      setWeekdays(availability.weekdays);
      setStartTime(availability.startTime);
      setEndTime(availability.endTime);
      setValidFrom(availability.validFrom);
      setValidUntil(availability.validUntil);
    }
  }, [availability]);

  const loadExistingImages = async (experienceId: string) => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('experience_id', experienceId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading images:', error);
      return;
    }

    if (data) {
      setImages(data.map(m => ({
        id: m.id,
        url: m.url,
        storage_path: m.storage_path,
        sort_order: m.sort_order || 0,
      })));
    }
  };

  // Section completion checks
  const isBasicInfoComplete = title.length >= 3 && description.length >= 50 && durationMinutes && category !== null;
  const isLocationComplete = locationAddress.trim().length > 0 && locationLat !== null && locationLng !== null;
  const isPricingComplete = useMemo(() => {
    const maxP = parseInt(maxParticipants) || 0;
    const baseP = Math.round((parseFloat(basePriceCents) || 0) * 100);
    const extraP = Math.round((parseFloat(extraPersonCents) || 0) * 100);
    const inclP = parseInt(includedParticipants) || 0;

    if (pricingType === 'per_person') return extraP >= 100 && maxP >= 1;
    if (pricingType === 'flat_rate') return baseP >= 100 && maxP >= 1;
    if (pricingType === 'base_plus_extra') return baseP >= 100 && inclP >= 1 && maxP >= 1;
    return false;
  }, [pricingType, basePriceCents, extraPersonCents, includedParticipants, maxParticipants]);
  const isAvailabilityComplete = weekdays.length > 0;
  const isPoliciesComplete = true; // Always valid with defaults

  // Compute pricing config for preview
  const pricingConfig: PricingConfig | null = useMemo(() => {
    const maxP = parseInt(maxParticipants) || 1;
    const minP = parseInt(minParticipants) || 1;
    const baseP = Math.round((parseFloat(basePriceCents) || 0) * 100);
    const extraP = Math.round((parseFloat(extraPersonCents) || 0) * 100);
    const inclP = parseInt(includedParticipants) || 0;

    if (pricingType === 'per_person' && extraP > 0) {
      return { pricing_type: 'per_person', base_price_cents: 0, included_participants: 0, extra_person_cents: extraP, min_participants: minP, max_participants: maxP };
    }
    if (pricingType === 'flat_rate' && baseP > 0) {
      return { pricing_type: 'flat_rate', base_price_cents: baseP, included_participants: maxP, extra_person_cents: 0, min_participants: 1, max_participants: maxP };
    }
    if (pricingType === 'base_plus_extra' && baseP > 0 && inclP > 0) {
      return { pricing_type: 'base_plus_extra', base_price_cents: baseP, included_participants: inclP, extra_person_cents: extraP, min_participants: minP, max_participants: maxP };
    }
    return null;
  }, [pricingType, basePriceCents, includedParticipants, extraPersonCents, minParticipants, maxParticipants]);

  const priceExamples = useMemo(() => {
    if (!pricingConfig) return [];
    return getPriceExamples(pricingConfig);
  }, [pricingConfig]);

  // Handle location selection from autocomplete (with coordinates)
  const handleLocationChange = (address: string, lat: number, lng: number) => {
    setLocationAddress(address);
    setLocationLat(lat);
    setLocationLng(lng);
  };

  // Handle address change when user types (without coordinates yet)
  const handleAddressChange = (address: string) => {
    setLocationAddress(address);
    // Clear coordinates when user manually types
    setLocationLat(null);
    setLocationLng(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partner?.id) {
      toast({
        title: 'Error',
        description: 'Partner information not found.',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!title.trim() || title.length < 3) {
      toast({ title: 'Validation error', description: 'Title must be at least 3 characters.', variant: 'destructive' });
      return;
    }

    if (!description.trim() || description.length < 50) {
      toast({ title: 'Validation error', description: 'Description must be at least 50 characters.', variant: 'destructive' });
      return;
    }

    if (!category) {
      toast({ title: 'Validation error', description: 'Please select a category.', variant: 'destructive' });
      return;
    }

    const durationValue = parseInt(durationMinutes);
    if (isNaN(durationValue) || durationValue < 15) {
      toast({ title: 'Validation error', description: 'Please select a duration.', variant: 'destructive' });
      return;
    }

    const participantsValue = parseInt(maxParticipants);
    if (isNaN(participantsValue) || participantsValue < 1) {
      toast({ title: 'Validation error', description: 'Max participants must be at least 1.', variant: 'destructive' });
      return;
    }

    // Validate pricing
    const minP = parseInt(minParticipants) || 1;
    const baseP = Math.round((parseFloat(basePriceCents) || 0) * 100);
    const extraP = Math.round((parseFloat(extraPersonCents) || 0) * 100);
    const inclP = parseInt(includedParticipants) || 0;

    if (pricingType === 'per_person' && extraP < 100) {
      toast({ title: 'Validation error', description: 'Price per person must be at least 1€.', variant: 'destructive' });
      return;
    }

    if (pricingType === 'flat_rate' && baseP < 100) {
      toast({ title: 'Validation error', description: 'Flat rate price must be at least 1€.', variant: 'destructive' });
      return;
    }

    if (pricingType === 'base_plus_extra') {
      if (baseP < 100) {
        toast({ title: 'Validation error', description: 'Base price must be at least 1€.', variant: 'destructive' });
        return;
      }
      if (inclP < 1) {
        toast({ title: 'Validation error', description: 'Included participants must be at least 1.', variant: 'destructive' });
        return;
      }
    }

    if (minP > participantsValue) {
      toast({ title: 'Validation error', description: 'Minimum participants cannot exceed maximum.', variant: 'destructive' });
      return;
    }

    // Validate location (mandatory for new experiences)
    if (!isEditing && (!locationAddress.trim() || locationLat === null || locationLng === null)) {
      toast({ 
        title: 'Validation error', 
        description: 'Please set a location for your experience. Hotels need to know where experiences are located.', 
        variant: 'destructive' 
      });
      return;
    }

    // If editing and location is set, validate it
    if (isEditing && locationAddress.trim() && (locationLat === null || locationLng === null)) {
      toast({ 
        title: 'Validation error', 
        description: 'Please geocode the location address to save coordinates.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);

    try {
      const coverImageUrl = images.length > 0 ? images[0].url : null;
      const legacyPriceCents = pricingType === 'per_person' ? extraP : baseP;

      // Prepare location data if available
      // Supabase expects PostGIS geography as a string in WKT format: 'POINT(lng lat)'
      let locationData: any = {};
      if (locationAddress.trim() && locationLat !== null && locationLng !== null) {
        locationData.location_address = locationAddress.trim();
        // Format as PostGIS POINT: POINT(longitude latitude) - note: lng comes first in PostGIS
        locationData.location = `POINT(${locationLng} ${locationLat})`;
      }

      const experienceData = {
        partner_id: partner.id,
        title: title.trim(),
        slug: slugify(title),
        description: description.trim(),
        tags: category ? [category] : [], // Store category as single-element array for backwards compatibility
        image_url: coverImageUrl,
        price_cents: legacyPriceCents,
        currency: 'EUR',
        duration_minutes: durationValue,
        max_participants: participantsValue,
        meeting_point: meetingPoint.trim() || null,
        allows_requests: allowsRequests,
        experience_status: 'draft',
        pricing_type: pricingType,
        base_price_cents: pricingType === 'flat_rate' || pricingType === 'base_plus_extra' ? baseP : 0,
        included_participants: pricingType === 'base_plus_extra' ? inclP : (pricingType === 'flat_rate' ? participantsValue : 0),
        extra_person_cents: pricingType === 'per_person' || pricingType === 'base_plus_extra' ? extraP : 0,
        min_participants: pricingType === 'flat_rate' ? 1 : minP,
        cancellation_policy: cancellationPolicy,
        force_majeure_refund: forceMajeureRefund,
        available_languages: availableLanguages,
        ...locationData,
      };

      let experienceId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('experiences')
          .update(experienceData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('experiences')
          .insert(experienceData)
          .select('id')
          .single();
        
        if (error) throw error;
        experienceId = data.id;
      }

      // Save media records
      if (experienceId) {
        const updatedCoverUrl = await saveMediaRecords(experienceId, partner.id);
        
        if (updatedCoverUrl) {
          await supabase
            .from('experiences')
            .update({ image_url: updatedCoverUrl })
            .eq('id', experienceId);
        }

        // Save availability
        await saveAvailability.mutateAsync({
          experienceId,
          data: {
            weekdays,
            startTime,
            endTime,
            validFrom,
            validUntil,
          },
        });
      }

      toast({
        title: isEditing ? 'Experience updated' : 'Experience created',
        description: 'Your changes have been saved.',
      });

      await refetchExperiences();
      
      if (isEditing) {
        navigate(`/supplier/experiences/${id}`);
      } else {
        navigate('/supplier/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save experience.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMediaRecords = async (experienceId: string, partnerId: string): Promise<string | null> => {
    const { data: existingMedia } = await supabase
      .from('media')
      .select('id, storage_path')
      .eq('experience_id', experienceId);

    const existingIds = new Set(existingMedia?.map(m => m.id) || []);
    const currentIds = new Set(images.map(m => m.id));

    const toDelete = existingMedia?.filter(m => !currentIds.has(m.id)) || [];
    if (toDelete.length > 0) {
      await supabase.from('media').delete().in('id', toDelete.map(m => m.id));
    }

    for (const image of images) {
      if (existingIds.has(image.id)) {
        await supabase.from('media').update({ sort_order: image.sort_order }).eq('id', image.id);
      } else {
        let storagePath = image.storage_path;
        if (storagePath.includes('/temp-')) {
          const newPath = storagePath.replace(/\/temp-\d+\//, `/${experienceId}/`);
          const { error: moveError } = await supabase.storage.from('traverum-assets').move(storagePath, newPath);
          
          if (!moveError) {
            storagePath = newPath;
            const { data: urlData } = supabase.storage.from('traverum-assets').getPublicUrl(newPath);
            image.url = urlData.publicUrl;
          }
        }

        await supabase.from('media').insert({
          id: image.id,
          partner_id: partnerId,
          experience_id: experienceId,
          storage_path: storagePath,
          url: image.url,
          sort_order: image.sort_order,
          media_type: 'image',
        });
      }
    }

    const coverImage = images.find(img => img.sort_order === 0) || images[0];
    return coverImage?.url || null;
  };

  return (
    <div className="min-h-screen bg-background-alt">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(isEditing ? `/supplier/experiences/${id}` : '/supplier/dashboard')}
          >
            Back
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditing ? 'Edit Experience' : 'Create Experience'}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Basic Info */}
          <FormSection
            title="Basic Info"
            description="Describe your experience to attract guests"
            stepNumber={1}
            isComplete={isBasicInfoComplete}
            isOpen={openSections.basicInfo}
            onOpenChange={(open) => setOpenSections(s => ({ ...s, basicInfo: open }))}
          >
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sunset Sailing Tour"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a catchy, descriptive title
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <CategorySelector
                  value={category}
                  onChange={setCategory}
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe what guests will experience..."
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 50 characters ({description.length}/50)
                </p>
              </div>

              {/* Images */}
              {partner?.id && (
                <ImageUploader
                  partnerId={partner.id}
                  experienceId={id || null}
                  images={images}
                  onImagesChange={setImages}
                  maxImages={10}
                />
              )}

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Select value={durationMinutes} onValueChange={setDurationMinutes} disabled={loading}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Meeting Point */}
              <div className="space-y-2">
                <Label htmlFor="meetingPoint">Meeting Point</Label>
                <Input
                  id="meetingPoint"
                  placeholder="e.g., Main hotel lobby or specific address"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Available Languages */}
              <div className="space-y-2">
                <LanguageSelector
                  selectedLanguages={availableLanguages}
                  onLanguagesChange={setAvailableLanguages}
                  disabled={loading}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 2: Location */}
          <FormSection
            title="Location"
            description="Set the location where this experience takes place. Hotels will use this to find experiences near them."
            stepNumber={2}
            isComplete={isLocationComplete}
            isOpen={openSections.location}
            onOpenChange={(open) => setOpenSections(s => ({ ...s, location: open }))}
          >
            <div className="space-y-6">
              <LocationAutocomplete
                value={locationAddress}
                onChange={handleLocationChange}
                onAddressChange={handleAddressChange}
                placeholder="e.g., 123 Main Street, Barcelona, Spain"
                label="Experience Location Address"
                required
                disabled={loading}
              />

              {!isLocationComplete && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <strong>Location is required.</strong> Hotels need to know where your experience is located to show it to their guests.
                  </p>
                </div>
              )}
            </div>
          </FormSection>

          {/* Section 3: Pricing */}
          <FormSection
            title="Pricing"
            description="Choose how you want to charge for this experience"
            stepNumber={3}
            isComplete={isPricingComplete}
            isOpen={openSections.pricing}
            onOpenChange={(open) => setOpenSections(s => ({ ...s, pricing: open }))}
          >
            <div className="space-y-6">
              {/* Pricing Type */}
              <RadioGroup
                value={pricingType}
                onValueChange={(v) => setPricingType(v as PricingType)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="per_person" id="per_person" className="mt-1" />
                  <div>
                    <Label htmlFor="per_person" className="font-medium cursor-pointer">Per person</Label>
                    <p className="text-sm text-muted-foreground">Same price for each guest (e.g. walking tour)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="flat_rate" id="flat_rate" className="mt-1" />
                  <div>
                    <Label htmlFor="flat_rate" className="font-medium cursor-pointer">Flat rate</Label>
                    <p className="text-sm text-muted-foreground">One price for any group size (e.g. private boat charter)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="base_plus_extra" id="base_plus_extra" className="mt-1" />
                  <div>
                    <Label htmlFor="base_plus_extra" className="font-medium cursor-pointer">Base + extras</Label>
                    <p className="text-sm text-muted-foreground">Base price includes X guests, extra per additional</p>
                  </div>
                </div>
              </RadioGroup>

              {/* Per Person Fields */}
              {pricingType === 'per_person' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="extraPersonCents">Price per person (EUR) *</Label>
                    <Input id="extraPersonCents" type="number" min="1" step="0.01" value={extraPersonCents} onChange={(e) => setExtraPersonCents(e.target.value)} disabled={loading} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minParticipants">Minimum guests</Label>
                      <Input id="minParticipants" type="number" min="1" value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} disabled={loading} />
                      <p className="text-xs text-muted-foreground">Guests pay for at least this many</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Maximum guests *</Label>
                      <Input id="maxParticipants" type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                </div>
              )}

              {/* Flat Rate Fields */}
              {pricingType === 'flat_rate' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="basePriceCents">Total price (EUR) *</Label>
                    <Input id="basePriceCents" type="number" min="1" step="0.01" value={basePriceCents} onChange={(e) => setBasePriceCents(e.target.value)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipantsFlat">Maximum guests *</Label>
                    <Input id="maxParticipantsFlat" type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} disabled={loading} />
                    <p className="text-xs text-muted-foreground">How many guests can book at this flat rate</p>
                  </div>
                </div>
              )}

              {/* Base + Extra Fields */}
              {pricingType === 'base_plus_extra' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePriceCentsExtra">Base price (EUR) *</Label>
                      <Input id="basePriceCentsExtra" type="number" min="1" step="0.01" value={basePriceCents} onChange={(e) => setBasePriceCents(e.target.value)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="includedParticipants">Guests included *</Label>
                      <Input id="includedParticipants" type="number" min="1" value={includedParticipants} onChange={(e) => setIncludedParticipants(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extraPersonCentsBase">Extra person price (EUR)</Label>
                    <Input id="extraPersonCentsBase" type="number" min="0" step="0.01" value={extraPersonCents} onChange={(e) => setExtraPersonCents(e.target.value)} disabled={loading} />
                    <p className="text-xs text-muted-foreground">Price for each guest beyond included amount</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minParticipantsBase">Minimum guests</Label>
                      <Input id="minParticipantsBase" type="number" min="1" value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipantsBase">Maximum guests *</Label>
                      <Input id="maxParticipantsBase" type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} disabled={loading} />
                    </div>
                  </div>
                </div>
              )}

              {/* Price Preview */}
              {pricingConfig && priceExamples.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Price preview</p>
                  <div className="grid grid-cols-3 gap-2">
                    {priceExamples.map((ex) => (
                      <div key={ex.participants} className="text-center p-2 bg-background rounded">
                        <p className="text-lg font-semibold">{ex.price}</p>
                        <p className="text-xs text-muted-foreground">{ex.participants} {ex.participants === 1 ? 'guest' : 'guests'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Section 4: Availability */}
          <FormSection
            title="Availability"
            description="When can guests book this experience?"
            stepNumber={4}
            isComplete={isAvailabilityComplete}
            isOpen={openSections.availability}
            onOpenChange={(open) => setOpenSections(s => ({ ...s, availability: open }))}
          >
            <AvailabilityEditor
              weekdays={weekdays}
              startTime={startTime}
              endTime={endTime}
              validFrom={validFrom}
              validUntil={validUntil}
              onWeekdaysChange={setWeekdays}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onValidFromChange={setValidFrom}
              onValidUntilChange={setValidUntil}
              disabled={loading}
            />
          </FormSection>

          {/* Section 5: Policies */}
          <FormSection
            title="Policies"
            description="Set cancellation rules and booking preferences"
            stepNumber={5}
            isComplete={isPoliciesComplete}
            isOpen={openSections.policies}
            onOpenChange={(open) => setOpenSections(s => ({ ...s, policies: open }))}
          >
            <div className="space-y-6">
              <CancellationPolicySelector
                policy={cancellationPolicy}
                forceMajeureRefund={forceMajeureRefund}
                onPolicyChange={setCancellationPolicy}
                onForceMajeureChange={setForceMajeureRefund}
                disabled={loading}
              />

              {/* Booking Mode */}
              <div className="pt-4 border-t">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <Label htmlFor="allowsRequests" className="font-medium">Accept booking requests</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Guests can request any date within your availability. You approve or decline each request.
                    </p>
                  </div>
                  <Switch
                    id="allowsRequests"
                    checked={allowsRequests}
                    onCheckedChange={setAllowsRequests}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </FormSection>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Experience'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
