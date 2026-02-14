import { useState, useEffect, useRef } from 'react';
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
import { validateExperienceForActivation } from '@/lib/experienceActivation';
import { useDebounce } from '@/hooks/useDebounce';
import { Check, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { LanguageSelector } from '@/components/LanguageSelector';
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

// Wrapper that forces full remount when switching between experiences.
// This ensures all useState, useRef, and useDebounce hooks reset cleanly — 
// no stale data leaks, no flicker, no race conditions.
export default function ExperienceDashboard() {
  const { id } = useParams<{ id: string }>();
  return <ExperienceDashboardInner key={id} />;
}

function ExperienceDashboardInner() {
  const { id: experienceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner, experiences, refetchExperiences } = useSupplierData();
  const { availability, isLoading: availabilityLoading, saveAvailability } = useExperienceAvailability(experienceId || null);

  // Resolve experience early so we can seed initial state from React Query cache.
  // When navigating from the sidebar the data is already cached → no flash.
  const experience = experiences.find(e => e.id === experienceId);
  const exp: any = experience; // shorthand for accessing fields that aren't in the strict type

  const [activeTab, setActiveTab] = useState('basic');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteExperienceConfirm, setShowDeleteExperienceConfirm] = useState(false);
  const [deleteExperienceConfirmText, setDeleteExperienceConfirmText] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const hasInitialized = useRef(false);
  const hasAvailabilityInitialized = useRef(false);
  const hasImagesLoaded = useRef(false);

  // Form state — seeded from cached experience so the first render already shows correct data
  const [title, setTitle] = useState(() => experience?.title || '');
  const [category, setCategory] = useState<string | null>(() => {
    const tags = exp?.tags || [];
    return tags.length > 0 ? tags[0] : null;
  });
  const [description, setDescription] = useState(() => experience?.description || '');
  const [images, setImages] = useState<MediaItem[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(() => experience?.duration_minutes?.toString() || '');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(() => exp?.available_languages || []);
  const [locationAddress, setLocationAddress] = useState(() => exp?.location_address || '');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [meetingPoint, setMeetingPoint] = useState(() => experience?.meeting_point || '');
  const [minParticipants, setMinParticipants] = useState(() => (exp?.min_participants || 1).toString());
  const [maxParticipants, setMaxParticipants] = useState(() => experience?.max_participants?.toString() || '');
  
  const [pricingType, setPricingType] = useState<PricingType>(() => exp?.pricing_type || 'per_person');
  const [basePriceCents, setBasePriceCents] = useState(() => ((exp?.base_price_cents / 100) || 0).toString());
  const [includedParticipants, setIncludedParticipants] = useState(() => (exp?.included_participants || 0).toString());
  const [extraPersonCents, setExtraPersonCents] = useState(() =>
    ((exp?.extra_person_cents / 100) || (experience?.price_cents ? experience.price_cents / 100 : 0)).toString()
  );
  const [minDays, setMinDays] = useState(() => (exp?.min_days || 1).toString());
  const [maxDays, setMaxDays] = useState(() => (exp?.max_days || '').toString());
  
  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [validFrom, setValidFrom] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(() => exp?.cancellation_policy || 'moderate');
  const [forceMajeureRefund, setForceMajeureRefund] = useState(() => exp?.force_majeure_refund ?? true);
  const [allowsRequests, setAllowsRequests] = useState(() => experience?.allows_requests ?? true);

  // Ref to track latest form values for flush-on-unmount (avoids stale closures)
  const formValuesRef = useRef<any>(null);
  const refetchRef = useRef(refetchExperiences);
  refetchRef.current = refetchExperiences;

  // Stable ref for saveAvailability to avoid it as a dependency in auto-save effects.
  // useMutation returns an unstable reference that changes on every render,
  // which would constantly reset the auto-save timer and create infinite save loops.
  const saveAvailabilityRef = useRef(saveAvailability);
  saveAvailabilityRef.current = saveAvailability;

  // Keep form values ref in sync on every render (cheap, no side effects).
  // Includes availability values so the unmount flush can save them too.
  useEffect(() => {
    if (!hasInitialized.current) return;
    formValuesRef.current = {
      title, category, description, durationMinutes, locationAddress, locationLat, locationLng,
      meetingPoint, minParticipants, maxParticipants, pricingType, basePriceCents,
      includedParticipants, extraPersonCents, minDays, maxDays,
      cancellationPolicy, forceMajeureRefund, allowsRequests, availableLanguages,
      weekdays, startTime, endTime, validFrom, validUntil,
    };
  });

  // Flush pending changes on unmount — ensures no edits are lost when switching experiences
  useEffect(() => {
    return () => {
      const vals = formValuesRef.current;
      if (!vals || !experienceId) return;

      const durationValue = parseInt(vals.durationMinutes) || 60;
      const maxP = parseInt(vals.maxParticipants) || 10;
      const minP = parseInt(vals.minParticipants) || 1;
      const baseP = Math.round((parseFloat(vals.basePriceCents) || 0) * 100);
      const extraP = Math.round((parseFloat(vals.extraPersonCents) || 0) * 100);
      const inclP = parseInt(vals.includedParticipants) || 0;
      const legacyPriceCents = vals.pricingType === 'per_person' || vals.pricingType === 'per_day' ? extraP : baseP;

      let locationData: any = {};
      if (vals.locationAddress?.trim() && vals.locationLat !== null && vals.locationLng !== null) {
        locationData.location_address = vals.locationAddress.trim();
        locationData.location = `POINT(${vals.locationLng} ${vals.locationLat})`;
      }

      const experienceData: any = {
        title: vals.title?.trim() || 'New Experience',
        slug: slugify(vals.title || 'new-experience') + `-${experienceId.slice(0, 8)}`,
        description: vals.description?.trim() || '',
        tags: vals.category ? [vals.category] : [],
        duration_minutes: durationValue,
        ...locationData,
        meeting_point: vals.meetingPoint?.trim() || null,
        max_participants: maxP,
        min_participants: minP,
        ...(legacyPriceCents > 0 ? { price_cents: legacyPriceCents } : {}),
        pricing_type: vals.pricingType,
        base_price_cents: vals.pricingType === 'flat_rate' || vals.pricingType === 'base_plus_extra' ? baseP : 0,
        included_participants: vals.pricingType === 'base_plus_extra' ? inclP : (vals.pricingType === 'flat_rate' ? maxP : 0),
        extra_person_cents: vals.pricingType === 'per_person' || vals.pricingType === 'base_plus_extra' || vals.pricingType === 'per_day' ? extraP : 0,
        cancellation_policy: vals.cancellationPolicy,
        force_majeure_refund: vals.forceMajeureRefund,
        allows_requests: vals.allowsRequests,
        available_languages: vals.availableLanguages,
      };

      if (vals.pricingType === 'per_day') {
        experienceData.min_days = parseInt(vals.minDays) || 1;
        experienceData.max_days = vals.maxDays?.trim() ? parseInt(vals.maxDays) : null;
      }

      // Fire-and-forget: save to DB then refresh sidebar
      supabase
        .from('experiences')
        .update(experienceData)
        .eq('id', experienceId)
        .then(() => refetchRef.current());

      // Also flush pending availability changes (prevents data loss when switching experiences quickly)
      if (hasAvailabilityInitialized.current && vals.weekdays) {
        supabase
          .from('experience_availability')
          .select('id')
          .eq('experience_id', experienceId)
          .limit(1)
          .then(({ data: existing }) => {
            const payload = {
              experience_id: experienceId,
              weekdays: vals.weekdays,
              start_time: vals.startTime,
              end_time: vals.endTime,
              valid_from: vals.validFrom,
              valid_until: vals.validUntil,
              updated_at: new Date().toISOString(),
            };
            if (existing && existing.length > 0) {
              return supabase.from('experience_availability').update(payload).eq('id', existing[0].id);
            } else {
              return supabase.from('experience_availability').insert(payload);
            }
          })
          .catch(() => {}); // fire-and-forget
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — with key-based remount, experienceId is stable for the component's lifetime

  // Load existing experience data
  useEffect(() => {
    if (experience && !hasInitialized.current) {
      setTitle(experience.title);
      // Extract category from tags array (first element, for backwards compatibility)
      const tags = (experience as any).tags || [];
      setCategory(tags.length > 0 ? tags[0] : null);
      setDescription(experience.description);
      setDurationMinutes(experience.duration_minutes.toString());
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
      
      // Meeting point
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

  // Load availability — only once, when data first arrives.
  // Without this guard, every query refetch (e.g. after save, window refocus)
  // would overwrite unsaved user edits with stale DB data.
  // Also marks as initialized when the query completes with null (new experience,
  // no existing rules), so the auto-save can start working when the user makes changes.
  useEffect(() => {
    if (hasAvailabilityInitialized.current) return;
    if (availabilityLoading) return; // Still loading, wait

    // Query completed — either with data or null (new experience with no rules yet)
    if (availability) {
      setWeekdays(availability.weekdays);
      setStartTime(availability.startTime);
      setEndTime(availability.endTime);
      setValidFrom(availability.validFrom);
      setValidUntil(availability.validUntil);
    }
    // Mark as initialized regardless — null means new experience with defaults
    hasAvailabilityInitialized.current = true;
  }, [availability, availabilityLoading]);

  const loadExistingImages = async (expId: string) => {
      const { data, error } = await supabase
      .from('media')
        .select('*')
      .eq('experience_id', expId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading images:', error);
      hasImagesLoaded.current = true; // Mark loaded even on error so auto-save guard unblocks
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
    hasImagesLoaded.current = true;
  };

  // Debounced values for auto-save
  const debouncedTitle = useDebounce(title, 2000);
  const debouncedCategory = useDebounce(category, 2000);
  const debouncedDescription = useDebounce(description, 2000);
  const debouncedLocationAddress = useDebounce(locationAddress, 2000);
  const debouncedLocationLat = useDebounce(locationLat, 2000);
  const debouncedLocationLng = useDebounce(locationLng, 2000);
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
  const debouncedAvailableLanguages = useDebounce(availableLanguages, 2000);

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

        // Prepare location data if available
        let locationData: any = {};
        if (debouncedLocationAddress.trim() && debouncedLocationLat !== null && debouncedLocationLng !== null) {
          locationData.location_address = debouncedLocationAddress.trim();
          // Format as WKT for PostGIS geography: POINT(lng lat) - note: lng comes first in PostGIS
          locationData.location = `POINT(${debouncedLocationLng} ${debouncedLocationLat})`;
        }

        const experienceData: any = {
          title: debouncedTitle.trim() || 'New Experience',
          slug: slugify(debouncedTitle || 'new-experience') + `-${experienceId?.slice(0, 8)}`,
          description: debouncedDescription.trim(),
          tags: debouncedCategory ? [debouncedCategory] : [], // Store category as single-element array
          duration_minutes: durationValue,
          ...locationData,
          meeting_point: debouncedMeetingPoint.trim() || null,
          max_participants: maxP,
          min_participants: minP,
          // Only update price_cents if it's greater than 0 (database constraint requires price_cents > 0)
          ...(legacyPriceCents > 0 ? { price_cents: legacyPriceCents } : {}),
          pricing_type: debouncedPricingType,
          base_price_cents: debouncedPricingType === 'flat_rate' || debouncedPricingType === 'base_plus_extra' ? baseP : 0,
          included_participants: debouncedPricingType === 'base_plus_extra' ? inclP : (debouncedPricingType === 'flat_rate' ? maxP : 0),
          extra_person_cents: debouncedPricingType === 'per_person' || debouncedPricingType === 'base_plus_extra' || debouncedPricingType === 'per_day' ? extraP : 0,
          cancellation_policy: debouncedCancellationPolicy,
          force_majeure_refund: debouncedForceMajeure,
          allows_requests: debouncedAllowsRequests,
          available_languages: debouncedAvailableLanguages,
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

        await refetchRef.current();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    experienceId,
    debouncedTitle, debouncedCategory, debouncedDescription, debouncedLocationAddress, debouncedLocationLat, debouncedLocationLng, debouncedMeetingPoint, debouncedDuration,
    debouncedMinParticipants, debouncedMaxParticipants, debouncedPricingType,
    debouncedBasePrice, debouncedIncludedParticipants, debouncedExtraPersonPrice,
    debouncedMinDays, debouncedMaxDays,
    debouncedCancellationPolicy, debouncedForceMajeure, debouncedAllowsRequests, debouncedAvailableLanguages,
    // refetchExperiences intentionally omitted — uses refetchRef.current to avoid unstable reference triggering extra saves
  ]);

  // Separate effect for availability changes.
  // Guards on both hasInitialized (experience loaded) AND hasAvailabilityInitialized
  // (availability loaded from DB) to prevent saving defaults before real data arrives.
  // Uses saveAvailabilityRef instead of saveAvailability to avoid unstable mutation
  // reference resetting the timer on every render.
  useEffect(() => {
    if (!experienceId || !hasInitialized.current || !hasAvailabilityInitialized.current) return;

    const saveAvail = async () => {
      try {
        await saveAvailabilityRef.current.mutateAsync({
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekdays, startTime, endTime, validFrom, validUntil, experienceId]);

  // Separate effect for images.
  // Guards on hasImagesLoaded to prevent the default empty `images` state from
  // triggering a save that deletes all existing media before DB images are loaded.
  useEffect(() => {
    if (!experienceId || !hasInitialized.current || !hasImagesLoaded.current || !partner?.id) return;

    const saveImages = async () => {
      try {
        await saveMediaRecords(experienceId, partner.id);
        await refetchRef.current();
      } catch (error) {
        console.error('Error saving images:', error);
      }
    };

    const timeout = setTimeout(saveImages, 2000);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, experienceId, partner?.id]);
  // refetchExperiences intentionally omitted — uses refetchRef.current to avoid unstable reference

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
    
    // Validate before allowing 'active' status
    if (newStatus === 'active') {
      const validation = validateExperienceForActivation({
        title,
        description,
        durationMinutes,
        maxParticipants,
        minParticipants,
        hasImage: images.length > 0 || !!(exp?.image_url),
        pricingType,
        basePriceCents,
        extraPersonCents,
        includedParticipants,
        minDays,
        allowsRequests,
        weekdays,
        startTime,
        endTime,
        cancellationPolicy,
      });

      if (!validation.valid) {
        toast({
          title: 'Cannot publish yet',
          description: `Please complete: ${validation.errors.join(', ')}.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
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
      // Block delete if any session still has reservations (guests must be refunded first)
      const { data: sessionIds } = await supabase
        .from('experience_sessions')
        .select('id')
        .eq('experience_id', experienceId);
      const ids = sessionIds?.map((s) => s.id) ?? [];
      if (ids.length > 0) {
        const { count } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .in('session_id', ids);
        if (count && count > 0) {
          toast({
            title: 'Cannot delete experience',
            description: 'Some sessions still have bookings. Cancel those sessions and refund guests first, then delete sessions with 0 bookings.',
            variant: 'destructive',
          });
          setDeleting(false);
          return;
        }
      }

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

      setShowDeleteExperienceConfirm(false);
      setDeleteExperienceConfirmText('');
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
          <div className="flex items-center gap-3">
            <TabsList className="flex-1 h-9">
              <TabsTrigger value="basic" className="text-sm">Basic</TabsTrigger>
              <TabsTrigger value="pricing" className="text-sm">Pricing</TabsTrigger>
              <TabsTrigger value="availability" className="text-sm">Availability</TabsTrigger>
              <TabsTrigger value="policies" className="text-sm">Policies</TabsTrigger>
              <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
            </TabsList>
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <Select
                value={currentStatus}
                onValueChange={handleStatusChange}
                disabled={statusUpdating}
              >
                <SelectTrigger className={cn(
                  "h-9 min-w-[120px] border-0 bg-[rgba(242,241,238,0.6)]",
                  currentStatus === 'active' && "bg-success/10 text-success border-success/20",
                  currentStatus === 'draft' && "bg-warning/10 text-warning border-warning/20",
                  currentStatus === 'archived' && "bg-muted text-muted-foreground"
                )}>
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        currentStatus === 'active' && "bg-success",
                        currentStatus === 'draft' && "bg-warning",
                        currentStatus === 'archived' && "bg-muted-foreground"
                      )} />
                      <span className="capitalize">{currentStatus}</span>
                      {statusUpdating && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span>Active</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="draft">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      <span>Draft</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="archived">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span>Archived</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  <LanguageSelector
                    selectedLanguages={availableLanguages}
                    onLanguagesChange={setAvailableLanguages}
                  />
                </div>

                <LocationAutocomplete
                  value={locationAddress}
                  onChange={handleLocationChange}
                  onAddressChange={handleAddressChange}
                  label="Experience Location"
                  required
                />

                <div className="space-y-2">
                  <Label htmlFor="meetingPoint" className="text-sm">Meeting Point</Label>
                  <Input
                    id="meetingPoint"
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    className="h-8"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Free-form description of where to meet
                  </p>
                </div>

                {pricingType !== 'per_day' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minParticipants" className="text-sm">Minimum Guests</Label>
                      <Input
                        id="minParticipants"
                        type="number"
                        min="1"
                        value={minParticipants}
                        onChange={(e) => setMinParticipants(e.target.value)}
                        className="h-8"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Guests always pay for at least this many people, even if fewer show up. Set to 1 for no minimum.
                      </p>
                    </div>
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
                )}
                {pricingType === 'per_day' && (
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
                )}

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

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  {pricingType !== 'per_day' && (
                    <div className="space-y-2">
                      <Label htmlFor="minParticipants" className="text-sm">Minimum Guests</Label>
                      <Input
                        id="minParticipants"
                        type="number"
                        min="1"
                        value={minParticipants}
                        onChange={(e) => setMinParticipants(e.target.value)}
                        className="h-8"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Guests always pay for at least this many people, even if fewer show up. Set to 1 for no minimum.
                      </p>
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
                    <div>
                      <Label htmlFor="allowsRequests" className="text-sm font-medium">
                        Accept booking requests
                      </Label>
                      {allowsRequests && (
                        <p className="text-xs text-muted-foreground mt-1">
                          When on, you must set operating days and hours in the Availability tab.
                        </p>
                      )}
                    </div>
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
                {/* Delete Experience */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium">Delete Experience</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Permanently delete this experience and all its data. Sessions must have 0 bookings first. This action cannot be undone.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <AlertDialog open={showDeleteExperienceConfirm} onOpenChange={(open) => { setShowDeleteExperienceConfirm(open); if (!open) setDeleteExperienceConfirmText(''); }}>
                    <Button variant="destructive" disabled={deleting} className="h-9 px-4" onClick={() => setShowDeleteExperienceConfirm(true)}>
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Experience'}
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          experience and remove it from any hotel partnerships. All sessions must have no bookings first.
                          Type <strong>delete</strong> below to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Input
                        placeholder="Type delete to confirm"
                        value={deleteExperienceConfirmText}
                        onChange={(e) => setDeleteExperienceConfirmText(e.target.value)}
                        className="mt-2"
                        autoComplete="off"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleting || deleteExperienceConfirmText !== 'delete'}
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
