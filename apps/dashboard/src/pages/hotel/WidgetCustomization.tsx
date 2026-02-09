import { useState, useEffect, useRef, useCallback } from 'react';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  Palette,
  Type,
  LayoutGrid,
  FileText,
  AlignLeft,
  AlignCenter,
  Space,
} from 'lucide-react';

// ── Constants ──
const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.traverum.com';

const FONT_OPTIONS = [
  { value: 'Poppins, system-ui, sans-serif', label: 'Poppins' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Playfair Display, Georgia, serif', label: 'Playfair Display' },
  { value: 'Fraunces, Georgia, serif', label: 'Fraunces' },
  { value: 'DM Sans, system-ui, sans-serif', label: 'DM Sans' },
  { value: 'Montserrat, system-ui, sans-serif', label: 'Montserrat' },
  { value: 'Lato, system-ui, sans-serif', label: 'Lato' },
  { value: 'Open Sans, system-ui, sans-serif', label: 'Open Sans' },
  { value: 'Roboto, system-ui, sans-serif', label: 'Roboto' },
  { value: 'Source Sans 3, system-ui, sans-serif', label: 'Source Sans 3' },
  { value: 'Merriweather, Georgia, serif', label: 'Merriweather' },
  { value: 'Outfit, system-ui, sans-serif', label: 'Outfit' },
];

const WEIGHT_OPTIONS = [
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
];

const RADIUS_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '0.25rem', label: '4px' },
  { value: '0.5rem', label: '8px' },
  { value: '0.75rem', label: '12px' },
  { value: '1rem', label: '16px' },
  { value: '1.5rem', label: '24px' },
];

const SPACING_PRESETS = [
  { value: '0.75rem', label: 'Small' },
  { value: '1.25rem', label: 'Medium' },
  { value: '1.5rem', label: 'Default' },
  { value: '2rem', label: 'Large' },
  { value: '2.5rem', label: 'Extra Large' },
  { value: '3rem', label: 'Huge' },
];

const PADDING_PRESETS = [
  { value: '0', label: 'None' },
  { value: '1rem 0', label: 'Small' },
  { value: '2rem 0', label: 'Medium' },
  { value: '3rem 0', label: 'Large' },
  { value: '4rem 0', label: 'Extra Large' },
  { value: '5rem 0', label: 'Huge' },
];

const GRID_WIDTH_PRESETS = [
  { value: '240px', label: 'Narrow' },
  { value: '280px', label: 'Default' },
  { value: '320px', label: 'Wide' },
  { value: '360px', label: 'Extra Wide' },
];

interface ThemeState {
  accent_color: string;
  text_color: string;
  background_color: string;
  card_radius: string;
  heading_font_family: string;
  body_font_family: string;
  heading_font_weight: string;
  font_size_base: string;
  title_font_size: string;
  widget_title: string;
  widget_subtitle: string;
  widget_title_enabled: boolean;
  widget_text_align: string;
  widget_section_padding: string;
  widget_title_margin: string;
  widget_grid_gap: string;
  widget_cta_margin: string;
  widget_grid_min_width: string;
}

const DEFAULT_THEME: ThemeState = {
  accent_color: '#2563eb',
  text_color: '#1a1a1a',
  background_color: '#ffffff',
  card_radius: '0.75rem',
  heading_font_family: 'Poppins, system-ui, sans-serif',
  body_font_family: 'Inter, system-ui, sans-serif',
  heading_font_weight: '200',
  font_size_base: '16',
  title_font_size: '2.5rem',
  widget_title: 'Local Experiences',
  widget_subtitle: 'Curated by the team at {{hotel_name}}',
  widget_title_enabled: true,
  widget_text_align: 'left',
  widget_section_padding: '0',
  widget_title_margin: '1.5rem',
  widget_grid_gap: '1.25rem',
  widget_cta_margin: '1.75rem',
  widget_grid_min_width: '280px',
};

// ── Color Input ──
function ColorField({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tooltip?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Label className="text-xs">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-sm border border-border cursor-pointer p-0.5 bg-transparent"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 font-mono text-xs flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ── Alignment Selector ──
function AlignmentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { value: 'left', icon: AlignLeft, label: 'Left aligned' },
    { value: 'center', icon: AlignCenter, label: 'Centered' },
  ];

  return (
    <div className="flex gap-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <Tooltip key={opt.value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex items-center justify-center w-8 h-8 rounded-sm transition-ui ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-[rgba(242,241,238,0.6)] text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{opt.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ── Live Preview ──
function LivePreview({ theme, hotelName }: { theme: ThemeState; hotelName: string }) {
  const subtitle = (theme.widget_subtitle || '').replace('{{hotel_name}}', hotelName);
  const headingFont = theme.heading_font_family.split(',')[0].trim().replace(/['"]/g, '');
  const bodyFont = theme.body_font_family.split(',')[0].trim().replace(/['"]/g, '');
  const align = theme.widget_text_align || 'left';

  return (
    <div
      className="rounded-sm border border-border overflow-hidden transition-all"
      style={{
        backgroundColor: theme.background_color,
        color: theme.text_color,
        fontFamily: theme.body_font_family,
        fontSize: `${parseInt(theme.font_size_base) || 16}px`,
        padding: theme.widget_section_padding !== '0' ? '1rem' : '1rem',
      }}
    >
      {/* Inject fonts */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@200;300;400;500;600;700&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600&display=swap`}
      />

      {/* Title */}
      {theme.widget_title_enabled && (
        <div style={{ marginBottom: '0.75rem', textAlign: align as any }}>
          <h2
            style={{
              fontFamily: theme.heading_font_family,
              fontWeight: parseInt(theme.heading_font_weight) || 200,
              fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              margin: '0 0 0.125rem',
              color: theme.text_color,
              lineHeight: 1.2,
            }}
          >
            {theme.widget_title || 'Local Experiences'}
          </h2>
          {subtitle && (
            <p
              style={{
                fontSize: '0.8rem',
                opacity: 0.65,
                margin: 0,
                color: theme.text_color,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Mock cards */}
      <div
        style={
          align === 'center'
            ? { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '0.5rem' }
            : { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }
        }
      >
        {[
          { title: 'Sunset Boat Tour', duration: '2h', price: '45' },
          { title: 'Wine Tasting', duration: '1h 30min', price: '35' },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              borderRadius: theme.card_radius,
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden',
              backgroundColor: theme.background_color,
              ...(align === 'center' ? { width: '45%', flexShrink: 0 } : {}),
            }}
          >
            {/* Image placeholder */}
            <div
              style={{
                width: '100%',
                paddingBottom: '66.67%',
                position: 'relative',
                background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  left: '0.5rem',
                  right: '0.5rem',
                  fontFamily: theme.heading_font_family,
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: '#fff',
                  lineHeight: 1.3,
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                {card.title}
              </span>
            </div>
            {/* Body */}
            <div
              style={{
                padding: '0.375rem 0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.625rem', opacity: 0.55 }}>{card.duration}</span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  color: theme.accent_color,
                }}
              >
                {card.price} €
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mock CTA */}
      <div style={{ textAlign: align as any, marginTop: '0.75rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.375rem 1rem',
            fontFamily: theme.body_font_family,
            fontWeight: 500,
            fontSize: '0.7rem',
            color: luminance(theme.accent_color) > 0.4 ? '#000' : '#fff',
            background: theme.accent_color,
            border: 'none',
            borderRadius: `calc(${theme.card_radius} * 0.667)`,
            cursor: 'default',
          }}
        >
          See all experiences
        </span>
      </div>
    </div>
  );
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ── Main Page ──
interface WidgetCustomizationProps {
  embedded?: boolean;
}

export default function WidgetCustomization({ embedded = false }: WidgetCustomizationProps) {
  const { activePartner, activePartnerId, isLoading: partnerLoading } = useActivePartner();
  const { activeHotelConfigId, isLoading: hotelConfigLoading } = useActiveHotelConfig();
  const { toast } = useToast();

  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
  const [hotelConfigId, setHotelConfigId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState('Hotel');
  const [hotelSlug, setHotelSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  // Load hotel config
  useEffect(() => {
    if (!activeHotelConfigId || partnerLoading || hotelConfigLoading) return;

    const loadConfig = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotel_configs')
        .select('*')
        .eq('id', activeHotelConfigId)
        .single();

      if (error) {
        console.error('Error loading hotel config:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const d = data as any;
        setHotelConfigId(d.id);
        setHotelName(d.display_name || 'Hotel');
        setHotelSlug(d.slug || '');
        setTheme({
          accent_color: d.accent_color || DEFAULT_THEME.accent_color,
          text_color: d.text_color || DEFAULT_THEME.text_color,
          background_color: d.background_color || DEFAULT_THEME.background_color,
          card_radius: d.card_radius || DEFAULT_THEME.card_radius,
          heading_font_family: d.heading_font_family || DEFAULT_THEME.heading_font_family,
          body_font_family: d.body_font_family || DEFAULT_THEME.body_font_family,
          heading_font_weight: d.heading_font_weight || DEFAULT_THEME.heading_font_weight,
          font_size_base: d.font_size_base || DEFAULT_THEME.font_size_base,
          title_font_size: d.title_font_size || DEFAULT_THEME.title_font_size,
          widget_title: d.widget_title || DEFAULT_THEME.widget_title,
          widget_subtitle: d.widget_subtitle || DEFAULT_THEME.widget_subtitle,
          widget_title_enabled: d.widget_title_enabled ?? DEFAULT_THEME.widget_title_enabled,
          widget_text_align: d.widget_text_align || DEFAULT_THEME.widget_text_align,
          widget_section_padding: d.widget_section_padding || DEFAULT_THEME.widget_section_padding,
          widget_title_margin: d.widget_title_margin || DEFAULT_THEME.widget_title_margin,
          widget_grid_gap: d.widget_grid_gap || DEFAULT_THEME.widget_grid_gap,
          widget_cta_margin: d.widget_cta_margin || DEFAULT_THEME.widget_cta_margin,
          widget_grid_min_width: d.widget_grid_min_width || DEFAULT_THEME.widget_grid_min_width,
        });
      }

      setLoading(false);
      // Mark initial load complete after a tick
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    };

    loadConfig();
  }, [activeHotelConfigId, partnerLoading, hotelConfigLoading]);

  // Autosave with debounce
  const saveConfig = useCallback(
    async (newTheme: ThemeState) => {
      if (!hotelConfigId) return;

      setSaveStatus('saving');

      try {
        const { error } = await supabase
          .from('hotel_configs')
          .update({
            accent_color: newTheme.accent_color,
            text_color: newTheme.text_color,
            background_color: newTheme.background_color,
            card_radius: newTheme.card_radius,
            heading_font_family: newTheme.heading_font_family,
            body_font_family: newTheme.body_font_family,
            heading_font_weight: newTheme.heading_font_weight,
            font_size_base: newTheme.font_size_base,
            title_font_size: newTheme.title_font_size,
            widget_title: newTheme.widget_title,
            widget_subtitle: newTheme.widget_subtitle,
            widget_title_enabled: newTheme.widget_title_enabled,
            widget_text_align: newTheme.widget_text_align,
            widget_section_padding: newTheme.widget_section_padding,
            widget_title_margin: newTheme.widget_title_margin,
            widget_grid_gap: newTheme.widget_grid_gap,
            widget_cta_margin: newTheme.widget_cta_margin,
            widget_grid_min_width: newTheme.widget_grid_min_width,
            updated_at: new Date().toISOString(),
          })
          .eq('id', hotelConfigId);

        if (error) throw error;

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        console.error('Error saving config:', error);
        setSaveStatus('error');
        toast({
          title: 'Error saving',
          description: error.message || 'Failed to save widget settings',
          variant: 'destructive',
        });
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    [hotelConfigId, toast]
  );

  // Update a field and trigger autosave
  const updateField = useCallback(
    <K extends keyof ThemeState>(key: K, value: ThemeState[K]) => {
      setTheme((prev) => {
        const next = { ...prev, [key]: value };

        // Skip autosave during initial load
        if (initialLoadRef.current) return next;

        // Debounce save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveConfig(next);
        }, 1200);

        return next;
      });
    },
    [saveConfig]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (partnerLoading || loading) {
    return (
      <div className={embedded ? 'flex items-center justify-center py-8' : 'container max-w-6xl mx-auto px-4 py-6 flex items-center justify-center'}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hotelConfigId) {
    return (
      <div className={embedded ? 'text-center py-8' : 'container max-w-6xl mx-auto px-4 py-6'}>
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-xl font-semibold text-foreground mb-2">No Hotel Property</h1>
          <p className="text-sm text-muted-foreground">
            You need a hotel property set up before you can customize the widget.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Autosave indicator - only when standalone */}
      {!embedded && saveStatus !== 'idle' && (
        <div className="fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border/50 rounded-md px-2.5 py-1 shadow-sm flex items-center gap-1.5">
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
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-[#B8866B]" />
              <span className="text-xs text-[#B8866B]">Error</span>
            </>
          )}
        </div>
      )}

      <div className={embedded ? '' : 'container max-w-6xl mx-auto px-4 py-6'}>
        {/* Header - hidden when embedded in tabs */}
        {!embedded && (
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-foreground">Widget Customization</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Customize how the experience widget looks on your website.
            </p>
          </div>
        )}

        {/* Two-column layout: Settings + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Settings Column */}
          <div className="lg:col-span-3 space-y-4">
            {/* ── Colors ── */}
            <Card className="border border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-primary/10">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">Colors</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ColorField
                    label="Accent"
                    value={theme.accent_color}
                    onChange={(v) => updateField('accent_color', v)}
                    tooltip="Buttons, prices, and interactive elements"
                  />
                  <ColorField
                    label="Text"
                    value={theme.text_color}
                    onChange={(v) => updateField('text_color', v)}
                    tooltip="Main text color throughout the widget"
                  />
                  <ColorField
                    label="Background"
                    value={theme.background_color}
                    onChange={(v) => updateField('background_color', v)}
                    tooltip="Widget and card background color"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Typography ── */}
            <Card className="border border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-primary/10">
                    <Type className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">Typography</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Heading Font */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Heading Font</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Font for titles and headings</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.heading_font_family}
                      onValueChange={(v) => updateField('heading_font_family', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Body Font */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Body Font</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Font for body text and buttons</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.body_font_family}
                      onValueChange={(v) => updateField('body_font_family', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            <span style={{ fontFamily: f.value }}>{f.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Heading Weight */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Heading Weight</Label>
                    <Select
                      value={theme.heading_font_weight}
                      onValueChange={(v) => updateField('heading_font_weight', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEIGHT_OPTIONS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Base Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Base Font Size</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Base size in pixels (default 16)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="12"
                        max="24"
                        value={theme.font_size_base}
                        onChange={(e) => updateField('font_size_base', e.target.value)}
                        className="h-8 flex-1"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Layout ── */}
            <Card className="border border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-primary/10">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">Layout</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Radius */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Card Corners</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Border radius for experience cards</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.card_radius}
                      onValueChange={(v) => updateField('card_radius', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RADIUS_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 border border-border bg-muted"
                                style={{ borderRadius: r.value }}
                              />
                              <span>{r.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Title Size</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Widget title font size (CSS value)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      value={theme.title_font_size}
                      onChange={(e) => updateField('title_font_size', e.target.value)}
                      className="h-8"
                      placeholder="2.5rem"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Spacing & Alignment ── */}
            <Card className="border border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-primary/10">
                    <Space className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">Spacing & Alignment</h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">Match these to your hotel website for a native look</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Widget Alignment */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Widget Alignment</Label>
                  <AlignmentSelector
                    value={theme.widget_text_align}
                    onChange={(v) => updateField('widget_text_align', v)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Section Padding */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Section Padding</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Inner padding around the entire widget</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.widget_section_padding}
                      onValueChange={(v) => updateField('widget_section_padding', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PADDING_PRESETS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title Margin */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Title Spacing</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Space between title and cards</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.widget_title_margin}
                      onValueChange={(v) => updateField('widget_title_margin', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACING_PRESETS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid Gap */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Card Gap</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Space between experience cards</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.widget_grid_gap}
                      onValueChange={(v) => updateField('widget_grid_gap', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACING_PRESETS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CTA Margin */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Button Spacing</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Space above the "See all" button</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.widget_cta_margin}
                      onValueChange={(v) => updateField('widget_cta_margin', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACING_PRESETS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grid Min Width */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Card Width</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Minimum width per card — controls how many columns appear</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={theme.widget_grid_min_width}
                      onValueChange={(v) => updateField('widget_grid_min_width', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRID_WIDTH_PRESETS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Widget Content ── */}
            <Card className="border border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">Content</h2>
                </div>

                {/* Show title toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Show Title</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Show or hide the heading above experience cards</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={theme.widget_title_enabled}
                    onCheckedChange={(v) => updateField('widget_title_enabled', v)}
                  />
                </div>

                {theme.widget_title_enabled && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={theme.widget_title}
                        onChange={(e) => updateField('widget_title', e.target.value)}
                        className="h-8"
                        placeholder="Local Experiences"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Subtitle</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Use {'{{hotel_name}}'} to insert your hotel name
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        value={theme.widget_subtitle}
                        onChange={(e) => updateField('widget_subtitle', e.target.value)}
                        className="h-8"
                        placeholder="Curated by the team at {{hotel_name}}"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Preview
              </p>
              <LivePreview theme={theme} hotelName={hotelName} />

              {/* Link to full preview */}
              {hotelSlug && (
                <div className="text-center pt-1">
                  <a
                    href={`${WIDGET_BASE_URL}/${hotelSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 transition-ui"
                  >
                    Open full widget page
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
