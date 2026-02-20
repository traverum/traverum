import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import existing hotel page components as tab content
import ExperienceSelection from './ExperienceSelection';
import WidgetCustomization from './WidgetCustomization';
import EmbedSetup from './EmbedSetup';


export default function StayDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activePartner, activePartnerId, isLoading: partnerLoading } = useActivePartner();
  const {
    activeHotelConfigId,
    setActiveHotelConfigId,
    hotelConfigs,
    isLoading: configLoading,
  } = useActiveHotelConfig();

  const [activeTab, setActiveTab] = useState('details');
  const [displayName, setDisplayName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePropertyConfirm, setShowDeletePropertyConfirm] = useState(false);
  const [deletePropertyConfirmText, setDeletePropertyConfirmText] = useState('');
  const hasInitialized = useRef(false);
  const userHasEdited = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Set the active hotel config from route param
  useEffect(() => {
    if (id && id !== activeHotelConfigId) {
      setActiveHotelConfigId(id);
    }
  }, [id, activeHotelConfigId, setActiveHotelConfigId]);

  // Find the current hotel config
  const hotelConfig = hotelConfigs.find((hc) => hc.id === id) || null;

  // Load data when config becomes available
  useEffect(() => {
    if (hotelConfig && !hasInitialized.current) {
      setDisplayName(hotelConfig.display_name || '');
      setWebsiteUrl((hotelConfig as any).website_url || '');
      setIsActive(hotelConfig.is_active ?? true);
      hasInitialized.current = true;
    }
  }, [hotelConfig]);

  // Reset initialization when ID changes
  useEffect(() => {
    hasInitialized.current = false;
    userHasEdited.current = false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, [id]);

  // Auto-save details (slug auto-generated from display name).
  // Uses a single debounce timer so both fields are always saved together
  // with their current values, avoiding stale-value races.
  useEffect(() => {
    if (!hasInitialized.current || !id || !userHasEdited.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const name = displayName.trim() || 'Untitled Property';
        const baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || 'property';

        let slug = baseSlug;
        let attempt = 0;
        while (true) {
          const { data: existing } = await supabase
            .from('hotel_configs')
            .select('id')
            .eq('slug', slug)
            .neq('id', id)
            .maybeSingle();
          if (!existing) break;
          attempt++;
          slug = `${baseSlug}-${attempt}`;
        }

        const updateData: Record<string, any> = {
          display_name: name,
          slug,
          website_url: websiteUrl.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('hotel_configs')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        await queryClient.invalidateQueries({
          queryKey: ['hotelConfigs', activePartnerId],
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        console.error('Error saving property:', error);
        toast({
          title: 'Error saving',
          description: error.message || 'Failed to save property settings',
          variant: 'destructive',
        });
        setSaveStatus('idle');
      }
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [displayName, websiteUrl, id, activePartnerId, queryClient, toast]);

  // Status change (Active / Inactive)
  const handleStatusChange = async (value: 'active' | 'inactive') => {
    const checked = value === 'active';
    setIsActive(checked);
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from('hotel_configs')
        .update({ is_active: checked, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ['hotelConfigs', activePartnerId],
      });
      toast({ title: 'Status updated', description: `Property is now ${value}.` });
    } catch (error: any) {
      setIsActive(!checked);
      toast({
        title: 'Error updating status',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete property
  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('hotel_configs').delete().eq('id', id);
      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: ['hotelConfigs', activePartnerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['partnerCapabilities', activePartnerId],
      });
      toast({ title: 'Property deleted' });
      setShowDeletePropertyConfirm(false);
      setDeletePropertyConfirmText('');
      navigate('/hotel/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error deleting',
        description: error.message || 'Failed to delete property',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Loading states
  if (partnerLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activePartner) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to manage properties.
        </p>
      </div>
    );
  }

  if (!hotelConfig) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Property not found</h2>
        <p className="text-muted-foreground mb-4">
          This property may have been deleted or doesn't exist.
        </p>
        <button
          onClick={() => navigate('/hotel/dashboard')}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Go to Stays home
        </button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center gap-3">
          <TabsList className="flex-1 h-9">
            <TabsTrigger value="details" className="text-sm">
              Details
            </TabsTrigger>
            <TabsTrigger value="experiences" className="text-sm">
              Experiences
            </TabsTrigger>
            <TabsTrigger value="style" className="text-sm">
              Widget Style
            </TabsTrigger>
            <TabsTrigger value="embed" className="text-sm">
              Embed
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={isActive ? 'active' : 'inactive'}
              onValueChange={(v) => handleStatusChange(v as 'active' | 'inactive')}
              disabled={statusUpdating}
            >
              <SelectTrigger
                className={cn(
                  'h-9 min-w-[120px] border-0 bg-[rgba(242,241,238,0.6)]',
                  isActive && 'bg-success/10 text-success border-success/20',
                  !isActive && 'bg-warning/10 text-warning border-warning/20'
                )}
              >
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isActive && 'bg-success',
                        !isActive && 'bg-warning'
                      )}
                    />
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
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
                <SelectItem value="inactive">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span>Inactive</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-1.5">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Saving</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-3 h-3 text-[#6B8E6B]" />
                  <span className="text-xs text-[#6B8E6B]">Saved</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Details */}
        <TabsContent value="details">
          <Card className="border-border">
            <CardContent className="pt-4 space-y-4">
              {/* Property Name */}
              <div className="space-y-2">
                <Label htmlFor="display-name" className="text-sm">
                  Property Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => { userHasEdited.current = true; setDisplayName(e.target.value); }}
                  placeholder="e.g. Hotel, Resort, B&B"
                  className="h-8"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="website-url" className="text-sm">
                  Website URL
                </Label>
                <Input
                  id="website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => { userHasEdited.current = true; setWebsiteUrl(e.target.value); }}
                  placeholder="https://www.yourhotel.com"
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground">
                  Used for the &ldquo;back to hotel&rdquo; button on the booking page.
                </p>
              </div>

              {hotelConfig?.slug && (
                <p className="text-xs text-muted-foreground">
                  Widget URL:{' '}
                  <span className="font-mono">book.traverum.com/{hotelConfig.slug}</span>
                </p>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* Tab 2: Experience Selection */}
        <TabsContent value="experiences">
          <ExperienceSelection embedded />
        </TabsContent>

        {/* Tab 3: Widget Style */}
        <TabsContent value="style">
          <WidgetCustomization embedded />
        </TabsContent>

        {/* Tab 4: Embed */}
        <TabsContent value="embed">
          <EmbedSetup embedded />
        </TabsContent>

        {/* Tab 5: Settings */}
        <TabsContent value="settings">
          <Card className="border-[#B8866B]/30">
            <CardContent className="pt-4 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Delete Property</h3>
                <AlertDialog open={showDeletePropertyConfirm} onOpenChange={(open) => { setShowDeletePropertyConfirm(open); if (!open) setDeletePropertyConfirmText(''); }}>
                  <button
                    type="button"
                    className="flex items-center gap-2 h-8 px-3 text-sm font-medium rounded-[3px] text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                    onClick={() => setShowDeletePropertyConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Property
                  </button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &quot;{displayName}&quot;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this property and all its widget
                        settings. This action cannot be undone. Type <strong>delete</strong> below to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                      placeholder="Type delete to confirm"
                      value={deletePropertyConfirmText}
                      onChange={(e) => setDeletePropertyConfirmText(e.target.value)}
                      className="mt-2"
                      autoComplete="off"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting || deletePropertyConfirmText !== 'delete'}
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
    </div>
  );
}
