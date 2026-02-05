import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSupplierData, Experience } from '@/hooks/useSupplierData';
import { useExperienceAvailability } from '@/hooks/useExperienceAvailability';
import { supabase } from '@/integrations/supabase/client';
import { ImageUploader, MediaItem } from '@/components/ImageUploader';
import { CategorySelector } from '@/components/CategorySelector';
import { AvailabilityEditor } from '@/components/experience/AvailabilityEditor';
import { CancellationPolicySelector } from '@/components/experience/CancellationPolicySelector';
import { PricingType } from '@/lib/pricing';
import { CancellationPolicy, DEFAULT_WEEKDAYS, DEFAULT_START_TIME, DEFAULT_END_TIME } from '@/lib/availability';
import { useDebounce } from '@/hooks/useDebounce';
import { Check, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function ExperienceDashboard() {
  const { id: experienceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner, experiences, refetchExperiences } = useSupplierData();
  const { availability, saveAvailability } = useExperienceAvailability(experienceId || null);

  const [activeTab, setActiveTab] = useState('basic');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const hasInitialized = useRef(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<MediaItem[]>([]);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [minParticipants, setMinParticipants] = useState('1');
  const [maxParticipants, setMaxParticipants] = useState('');
  
  const [pricingType, setPricingType] = useState<PricingType>('per_person');
  const [basePriceCents, setBasePriceCents] = useState('');
  const [includedParticipants, setIncludedParticipants] = useState('');
  const [extraPersonCents, setExtraPersonCents] = useState('');
  const [minDays, setMinDays] = useState('1');
  const [maxDays, setMaxDays] = useState('');
  
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [validFrom, setValidFrom] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('moderate');
  const [forceMajeureRefund, setForceMajeureRefund] = useState(true);
  const [allowsRequests, setAllowsRequests] = useState(true);

  const experience = experiences.find(e => e.id === experienceId);

  // Load existing experience data
  useEffect(() => {
    if (experience && !hasInitialized.current) {
      setTitle(experience.title);
      // Extract category from tags array (first element, for backwards compatibility)
      const tags = (experience as any).tags || [];
      setCategory(tags.length > 0 ? tags[0] : null);
      setDescription(experience.description);
      setDurationMinutes(experience.duration_minutes.toString());
      setMeetingPoint(experience.meeting_point || '');
      setMinParticipants(((experience as any).min_participants || 1).toString());
      setMaxParticipants(experience.max_participants.toString());
      
      const expPricingType = (experience as any).pricing_type || 'per_person';
      setPricingType(expPricingType);
      setBasePriceCents(((experience as any).base_price_cents / 100 || 0).toString());
      setIncludedParticipants(((experience as any).included_participants || 0).toString());
      setExtraPersonCents(((experience as any).extra_person_cents / 100 || experience.price_cents / 100).toString());
      setMinDays(((experience as any).min_days || 1).toString());
      setMaxDays(((experience as any).max_days || '').toString());
      
      setCancellationPolicy((experience as any).cancellation_policy || 'moderate');
      setForceMajeureRefund((experience as any).force_majeure_refund ?? true);
      setAllowsRequests(experience.allows_requests ?? true);
      
      loadExistingImages(experience.id);
      hasInitialized.current = true;
    }
  }, [experience]);

  // Load availability
  useEffect(() => {
    if (availability) {
      setWeekdays(availability.weekdays);
      setStartTime(availability.startTime);
      setEndTime(availability.endTime);
      setValidFrom(availability.validFrom);
      setValidUntil(availability.validUntil);
    }
  }, [availability]);

  const loadExistingImages = async (expId: string) => {
      const { data, error } = await supabase
      .from('media')
        .select('*')
      .eq('experience_id', expId)
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

  // Debounced values for auto-save
  const debouncedTitle = useDebounce(title, 2000);
  const debouncedCategory = useDebounce(category, 2000);
  const debouncedDescription = useDebounce(description, 2000);
  const debouncedMeetingPoint = useDebounce(meetingPoint, 2000);
  const debouncedDuration = useDebounce(durationMinutes, 2000);
  const debouncedMinParticipants = useDebounce(minParticipants, 2000);
  const debouncedMaxParticipants = useDebounce(maxParticipants, 2000);
  const debouncedPricingType = useDebounce(pricingType, 2000);
  const debouncedBasePrice = useDebounce(basePriceCents, 2000);
  const debouncedIncludedParticipants = useDebounce(includedParticipants, 2000);
  const debouncedExtraPersonPrice = useDebounce(extraPersonCents, 2000);
  const debouncedMinDays = useDebounce(minDays, 2000);
  const debouncedMaxDays = useDebounce(maxDays, 2000);
  const debouncedCancellationPolicy = useDebounce(cancellationPolicy, 2000);
  const debouncedForceMajeure = useDebounce(forceMajeureRefund, 2000);
  const debouncedAllowsRequests = useDebounce(allowsRequests, 2000);

  // Auto-save on debounced changes (only for form fields, not availability/images)
  useEffect(() => {
    if (!experienceId || !hasInitialized.current) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      try {
        const durationValue = parseInt(debouncedDuration) || 60;
        const maxP = parseInt(debouncedMaxParticipants) || 10;
        const minP = parseInt(debouncedMinParticipants) || 1;
        const baseP = Math.round((parseFloat(debouncedBasePrice) || 0) * 100);
        const extraP = Math.round((parseFloat(debouncedExtraPersonPrice) || 0) * 100);
        const inclP = parseInt(debouncedIncludedParticipants) || 0;
        const minD = debouncedPricingType === 'per_day' ? (parseInt(debouncedMinDays) || 1) : null;
        let maxD: number | null = null;
        if (debouncedPricingType === 'per_day' && debouncedMaxDays) {
          const trimmed = debouncedMaxDays.trim();
          if (trimmed) {
            const parsed = parseInt(trimmed);
            maxD = isNaN(parsed) ? null : parsed;
          }
        }
        const legacyPriceCents = debouncedPricingType === 'per_person' || debouncedPricingType === 'per_day' ? extraP : baseP;

        const experienceData: any = {
          title: debouncedTitle.trim() || 'New Experience',
          slug: slugify(debouncedTitle || 'new-experience'),
          description: debouncedDescription.trim(),
          tags: debouncedCategory ? [debouncedCategory] : [], // Store category as single-element array
          meeting_point: debouncedMeetingPoint.trim() || null,
          duration_minutes: durationValue,
          max_participants: maxP,
          min_participants: minP,
          price_cents: legacyPriceCents,
          pricing_type: debouncedPricingType,
          base_price_cents: debouncedPricingType === 'flat_rate' || debouncedPricingType === 'base_plus_extra' ? baseP : 0,
          included_participants: debouncedPricingType === 'base_plus_extra' ? inclP : (debouncedPricingType === 'flat_rate' ? maxP : 0),
          extra_person_cents: debouncedPricingType === 'per_person' || debouncedPricingType === 'base_plus_extra' || debouncedPricingType === 'per_day' ? extraP : 0,
          cancellation_policy: debouncedCancellationPolicy,
          force_majeure_refund: debouncedForceMajeure,
          allows_requests: debouncedAllowsRequests,
        };

        // Add rental pricing fields only for per_day type
        // Only include these fields if the pricing type is per_day to avoid errors if columns don't exist
        if (debouncedPricingType === 'per_day') {
          experienceData.min_days = minD;
          experienceData.max_days = maxD;
        }
        // Note: We don't set them to null for other types to avoid errors if columns don't exist yet

        const { error } = await supabase
          .from('experiences')
          .update(experienceData)
          .eq('id', experienceId);

        if (error) throw error;

        await refetchExperiences();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        setSaveStatus('error');
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        console.error('Auto-save error:', error);
        console.error('Error details:', {
          message: errorMessage,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        });
        
        // Show user-friendly error message
        toast({
          title: 'Auto-save failed',
          description: errorMessage.includes('column') && errorMessage.includes('does not exist')
            ? 'Database migration required. Please contact support or run: npx supabase migration up'
            : errorMessage.length > 100 
            ? errorMessage.substring(0, 100) + '...'
            : errorMessage,
          variant: 'destructive',
        });
      }
    };

    autoSave();
  }, [
    experienceId,
    debouncedTitle, debouncedCategory, debouncedDescription, debouncedMeetingPoint, debouncedDuration,
    debouncedMinParticipants, debouncedMaxParticipants, debouncedPricingType,
    debouncedBasePrice, debouncedIncludedParticipants, debouncedExtraPersonPrice,
    debouncedMinDays, debouncedMaxDays,
    debouncedCancellationPolicy, debouncedForceMajeure, debouncedAllowsRequests,
    refetchExperiences,
  ]);

  // Separate effect for availability changes
  useEffect(() => {
    if (!experienceId || !hasInitialized.current) return;

    const saveAvail = async () => {
      try {
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
      } catch (error) {
        console.error('Error saving availability:', error);
      }
    };

    const timeout = setTimeout(saveAvail, 2000);
    return () => clearTimeout(timeout);
  }, [weekdays, startTime, endTime, validFrom, validUntil, experienceId, saveAvailability]);

  // Separate effect for images
  useEffect(() => {
    if (!experienceId || !hasInitialized.current || !partner?.id) return;

    const saveImages = async () => {
      try {
        await saveMediaRecords(experienceId, partner.id);
        await refetchExperiences();
      } catch (error) {
        console.error('Error saving images:', error);
      }
    };

    const timeout = setTimeout(saveImages, 2000);
    return () => clearTimeout(timeout);
  }, [images, experienceId, partner?.id, refetchExperiences]);

  const saveMediaRecords = async (expId: string, partnerId: string): Promise<string | null> => {
    const { data: existingMedia } = await supabase
      .from('media')
      .select('id, storage_path')
      .eq('experience_id', expId);

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
          const newPath = storagePath.replace(/\/temp-\d+\//, `/${expId}/`);
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
          experience_id: expId,
          storage_path: storagePath,
          url: image.url,
          sort_order: image.sort_order,
          media_type: 'image',
        });
      }
    }

    const coverImage = images.find(img => img.sort_order === 0) || images[0];
    if (coverImage?.url) {
      await supabase
        .from('experiences')
        .update({ image_url: coverImage.url })
        .eq('id', expId);
    }
    return coverImage?.url || null;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!experienceId) return;
    
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from('experiences')
        .update({ experience_status: newStatus })
        .eq('id', experienceId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Experience is now ${newStatus}.`,
      });
      
      await refetchExperiences();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!experienceId) return;
    
    setDeleting(true);

    try {
      const { data: mediaData } = await supabase
        .from('media')
        .select('storage_path')
        .eq('experience_id', experienceId);

      if (mediaData && mediaData.length > 0) {
        await supabase.storage
          .from('traverum-assets')
          .remove(mediaData.map(m => m.storage_path));
      }

      await supabase
        .from('media')
        .delete()
        .eq('experience_id', experienceId);

      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId);
      
      if (error) throw error;
      
      toast({
        title: 'Experience deleted',
        description: 'The experience has been removed.',
      });

      await refetchExperiences();
      navigate('/supplier/experiences');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete experience.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Completion checks
  const isBasicInfoComplete = title.length >= 3 && description.length >= 50 && durationMinutes && maxParticipants;
  const isPricingComplete = useMemo(() => {
    const maxP = parseInt(maxParticipants) || 0;
    const baseP = Math.round((parseFloat(basePriceCents) || 0) * 100);
    const extraP = Math.round((parseFloat(extraPersonCents) || 0) * 100);
    const inclP = parseInt(includedParticipants) || 0;
    const minD = parseInt(minDays) || 0;

    if (pricingType === 'per_person') return extraP >= 100 && maxP >= 1;
    if (pricingType === 'flat_rate') return baseP >= 100 && maxP >= 1;
    if (pricingType === 'base_plus_extra') return baseP >= 100 && inclP >= 1 && maxP >= 1;
    if (pricingType === 'per_day') return extraP >= 100 && minD >= 1;
    return false;
  }, [pricingType, basePriceCents, extraPersonCents, includedParticipants, maxParticipants, minDays]);
  const isAvailabilityComplete = weekdays.length > 0;
  const isPoliciesComplete = true;


  const currentStatus = (experience as any)?.experience_status || 'draft';

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Experience not found</p>
          <Button onClick={() => navigate('/supplier/experiences')}>
            Back to Experiences
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background-alt">
      {/* Autosave indicator - Notion style */}
      {saveStatus !== 'idle' && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm border border-border/50 rounded-md px-2.5 py-1 shadow-sm text-xs transition-opacity">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
              <span className="text-muted-foreground">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3 h-3 text-[#6B8E6B]" />
              <span className="text-muted-foreground">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-[#B8866B]" />
              <span className="text-[#B8866B]">Error</span>
            </>
          )}
        </div>
      )}

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full h-9">
            <TabsTrigger value="basic" className="text-sm">Basic</TabsTrigger>
            <TabsTrigger value="pricing" className="text-sm">Pricing</TabsTrigger>
            <TabsTrigger value="availability" className="text-sm">Availability</TabsTrigger>
            <TabsTrigger value="policies" className="text-sm">Policies</TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic">
            <Card className="border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="title" className="text-sm">Title *</Label>
                  </div>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Sunset Sailing Tour"
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Category *</Label>
                  <CategorySelector
                    value={category}
                    onChange={setCategory}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="description" className="text-sm">Description *</Label>
                    {description.length > 0 && (
                      <span className={cn(
                        "text-xs",
                        description.length >= 50 ? "text-[#6B8E6B]" : "text-[#B8866B]"
                      )}>
                        {description.length}/50
                      </span>
                    )}
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Describe what guests will experience..."
                    className="resize-none"
                  />
                </div>

                {partner?.id && (
                  <div className="space-y-2">
                    <Label className="text-sm">Images</Label>
                    <ImageUploader
                      partnerId={partner.id}
                      experienceId={experienceId || null}
                      images={images}
                      onImagesChange={setImages}
                      maxImages={10}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm">Duration *</Label>
                  <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                    <SelectTrigger id="duration" className="h-8">
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

                <div className="space-y-2">
                  <Label htmlFor="meetingPoint" className="text-sm">Meeting Point</Label>
                  <Input
                    id="meetingPoint"
                    placeholder="e.g., Main hotel lobby"
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    className="h-8"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {pricingType !== 'per_day' && (
                    <div className="space-y-2">
                      <Label htmlFor="minParticipants" className="text-sm">Min Participants *</Label>
                      <Input
                        id="minParticipants"
                        type="number"
                        min="1"
                        value={minParticipants}
                        onChange={(e) => setMinParticipants(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants" className="text-sm">Max Participants *</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Pricing */}
          <TabsContent value="pricing">
            <Card className="border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pricing Type *</Label>
                  <RadioGroup
                    value={pricingType}
                    onValueChange={(v) => setPricingType(v as PricingType)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="per_person" id="per_person" />
                      <Label htmlFor="per_person" className="text-sm font-normal cursor-pointer">Per person</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flat_rate" id="flat_rate" />
                      <Label htmlFor="flat_rate" className="text-sm font-normal cursor-pointer">Flat rate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="base_plus_extra" id="base_plus_extra" />
                      <Label htmlFor="base_plus_extra" className="text-sm font-normal cursor-pointer">Base + extras</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="per_day" id="per_day" />
                      <Label htmlFor="per_day" className="text-sm font-normal cursor-pointer">Per day (Rental)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {pricingType === 'per_person' && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label htmlFor="extraPersonCents" className="text-sm">Price per person (EUR) *</Label>
                    <Input
                      id="extraPersonCents"
                      type="number"
                      min="1"
                      step="0.01"
                      value={extraPersonCents}
                      onChange={(e) => setExtraPersonCents(e.target.value)}
                      className="h-8"
                    />
                  </div>
                )}

                {pricingType === 'flat_rate' && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label htmlFor="basePriceCents" className="text-sm">Total price (EUR) *</Label>
                    <Input
                      id="basePriceCents"
                      type="number"
                      min="1"
                      step="0.01"
                      value={basePriceCents}
                      onChange={(e) => setBasePriceCents(e.target.value)}
                      className="h-8"
                    />
                  </div>
                )}

                {pricingType === 'base_plus_extra' && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basePriceCentsExtra" className="text-sm">Base price (EUR) *</Label>
                        <Input
                          id="basePriceCentsExtra"
                          type="number"
                          min="1"
                          step="0.01"
                          value={basePriceCents}
                          onChange={(e) => setBasePriceCents(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="includedParticipants" className="text-sm">Guests included *</Label>
                        <Input
                          id="includedParticipants"
                          type="number"
                          min="1"
                          value={includedParticipants}
                          onChange={(e) => setIncludedParticipants(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="extraPersonCentsBase" className="text-sm">Extra person price (EUR)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Price for each guest beyond included amount</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="extraPersonCentsBase"
                        type="number"
                        min="0"
                        step="0.01"
                        value={extraPersonCents}
                        onChange={(e) => setExtraPersonCents(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}

                {pricingType === 'per_day' && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerDay" className="text-sm">Price per day (EUR) *</Label>
                      <Input
                        id="pricePerDay"
                        type="number"
                        min="1"
                        step="0.01"
                        value={extraPersonCents}
                        onChange={(e) => setExtraPersonCents(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minDays" className="text-sm">Minimum rental period (days) *</Label>
                        <Input
                          id="minDays"
                          type="number"
                          min="1"
                          max="365"
                          value={minDays}
                          onChange={(e) => setMinDays(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxDays" className="text-sm">Maximum rental period (days)</Label>
                        <Input
                          id="maxDays"
                          type="number"
                          min="1"
                          max="365"
                          value={maxDays}
                          onChange={(e) => setMaxDays(e.target.value)}
                          className="h-8"
                          placeholder="No limit"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Availability */}
          <TabsContent value="availability">
            <Card className="border-border">
              <CardContent className="pt-4">
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
                />
          </CardContent>
        </Card>
          </TabsContent>

          {/* Tab 4: Policies */}
          <TabsContent value="policies">
            <Card className="border-border">
              <CardContent className="pt-4 space-y-4">
                <CancellationPolicySelector
                  policy={cancellationPolicy}
                  forceMajeureRefund={forceMajeureRefund}
                  onPolicyChange={setCancellationPolicy}
                  onForceMajeureChange={setForceMajeureRefund}
                />

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowsRequests" className="text-sm font-medium">
                      Accept booking requests
                    </Label>
                    <Switch
                      id="allowsRequests"
                      checked={allowsRequests}
                      onCheckedChange={setAllowsRequests}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Settings */}
          <TabsContent value="settings">
            <Card className="border-[#B8866B]/30">
              <CardContent className="pt-4 space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archive">Archive</SelectItem>
                    </SelectContent>
                  </Select>
                  {statusUpdating && (
                    <p className="text-xs text-muted-foreground">Updating status...</p>
                  )}
                </div>

                {/* Delete Experience */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium">Delete Experience</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Permanently delete this experience and all its data. This action cannot be undone.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={deleting} className="h-9 px-4">
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Experience'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          experience and remove it from any hotel partnerships.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </TooltipProvider>
  );
}
