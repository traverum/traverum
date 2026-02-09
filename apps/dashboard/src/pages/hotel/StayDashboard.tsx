import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, Check, Trash2 } from 'lucide-react';

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
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleting, setDeleting] = useState(false);
  const hasInitialized = useRef(false);

  const debouncedDisplayName = useDebounce(displayName, 1500);
  const debouncedSlug = useDebounce(slug, 1500);

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
      setSlug(hotelConfig.slug || '');
      setIsActive(hotelConfig.is_active ?? true);
      hasInitialized.current = true;
    }
  }, [hotelConfig]);

  // Reset initialization when ID changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [id]);

  // Auto-save details
  useEffect(() => {
    if (!hasInitialized.current || !id) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      try {
        const updateData: Record<string, any> = {
          display_name: debouncedDisplayName.trim() || 'Untitled Property',
          updated_at: new Date().toISOString(),
        };

        // Only update slug if changed and valid
        if (debouncedSlug.trim()) {
          updateData.slug = debouncedSlug
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        }

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
    };

    autoSave();
  }, [debouncedDisplayName, debouncedSlug, id, activePartnerId, queryClient, toast]);

  // Toggle active status
  const handleToggleActive = async (checked: boolean) => {
    setIsActive(checked);
    try {
      const { error } = await supabase
        .from('hotel_configs')
        .update({ is_active: checked, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await queryClient.invalidateQueries({
        queryKey: ['hotelConfigs', activePartnerId],
      });
    } catch (error: any) {
      setIsActive(!checked); // revert
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
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
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Hotel, Resort, B&B"
                  className="h-8"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm">
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-from-name"
                  className="h-8 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your widget will be available at:{' '}
                  <span className="font-mono">book.traverum.com/{slug || '...'}</span>
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <Label className="text-sm">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    When active, your widget is publicly accessible
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={handleToggleActive} />
              </div>
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
              {/* Delete Property */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">
                  Deleting this property will remove all its settings and widget
                  configurations. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 h-8 px-3 text-sm font-medium rounded-[3px] text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Property
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{displayName}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this property and all its widget
                        settings. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting}
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
