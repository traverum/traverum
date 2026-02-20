import { useState, useEffect, useRef, useCallback } from 'react';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  AlignLeft,
  AlignCenter,
  ChevronDown,
  SlidersHorizontal,
  ExternalLink,
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
  { value: '0', label: 'Sharp' },
  { value: '4px', label: 'Subtle' },
  { value: '8px', label: 'Rounded' },
  { value: '12px', label: 'Soft' },
  { value: '16px', label: 'Round' },
  { value: '24px', label: 'Pill' },
];

const SPACING_PRESETS = [
  { value: '12px', label: 'Compact' },
  { value: '20px', label: 'Default' },
  { value: '24px', label: 'Comfortable' },
  { value: '32px', label: 'Relaxed' },
  { value: '40px', label: 'Spacious' },
  { value: '48px', label: 'Airy' },
];

const PADDING_PRESETS = [
  { value: '0', label: 'None' },
  { value: '16px 0', label: 'Tight' },
  { value: '32px 0', label: 'Default' },
  { value: '48px 0', label: 'Relaxed' },
  { value: '64px 0', label: 'Spacious' },
  { value: '80px 0', label: 'Airy' },
];

const GRID_WIDTH_PRESETS = [
  { value: '240px', label: 'Narrow — more columns' },
  { value: '280px', label: 'Default' },
  { value: '320px', label: 'Wide — fewer columns' },
  { value: '360px', label: 'Extra wide' },
];

const TITLE_SIZE_PRESETS = [
  { value: '28px', label: 'Small' },
  { value: '34px', label: 'Medium' },
  { value: '40px', label: 'Default' },
  { value: '48px', label: 'Large' },
  { value: '56px', label: 'Extra Large' },
  { value: '64px', label: 'Hero' },
];

interface ThemeState {
  accent_color: string;
  heading_color: string;
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
  heading_color: '#1a1a1a',
  text_color: '#1a1a1a',
  background_color: '#ffffff',
  card_radius: '12px',
  heading_font_family: 'Poppins, system-ui, sans-serif',
  body_font_family: 'Inter, system-ui, sans-serif',
  heading_font_weight: '200',
  font_size_base: '16',
  title_font_size: '40px',
  widget_title: 'Local Experiences',
  widget_subtitle: 'Curated by the team at {{hotel_name}}',
  widget_title_enabled: true,
  widget_text_align: 'left',
  widget_section_padding: '0',
  widget_title_margin: '24px',
  widget_grid_gap: '20px',
  widget_cta_margin: '28px',
  widget_grid_min_width: '280px',
};

// ── Inline color picker ──
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-sm border border-border cursor-pointer p-0.5 bg-transparent"
        />
      </div>
      <div className="flex-1 min-w-0">
        <Label className="text-[11px] text-muted-foreground block mb-0.5">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 font-mono text-xs"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ── Alignment toggle ──
function AlignmentToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { value: 'left', icon: AlignLeft, label: 'Left' },
    { value: 'center', icon: AlignCenter, label: 'Center' },
  ];

  return (
    <div className="flex gap-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-2.5 h-7 rounded-sm text-xs transition-ui ${
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-[rgba(242,241,238,0.6)] text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Section divider ──
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider pt-1">
      {children}
    </p>
  );
}

// ── Help tooltip ──
function Help({ tip }: { tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs max-w-[200px]">{tip}</p>
      </TooltipContent>
    </Tooltip>
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
        padding: theme.widget_section_padding !== '0' ? theme.widget_section_padding : '1rem',
      }}
    >
      {/* Inject Google Fonts */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@200;300;400;500;600;700&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600&display=swap`}
      />

      {/* Title */}
      {theme.widget_title_enabled && (
        <div style={{ marginBottom: theme.widget_title_margin || '12px', textAlign: align as any }}>
          <h2
            style={{
              fontFamily: theme.heading_font_family,
              fontWeight: parseInt(theme.heading_font_weight) || 200,
              fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              margin: '0 0 0.125rem',
              color: theme.heading_color,
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
            ? { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: theme.widget_grid_gap || '12px' }
            : { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.widget_grid_gap || '12px' }
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
                {card.price} &euro;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mock CTA */}
      <div style={{ textAlign: align as any, marginTop: theme.widget_cta_margin || '12px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.375rem 1rem',
            fontFamily: theme.body_font_family,
            fontWeight: 500,
            fontSize: '0.7rem',
            color: luminance(theme.accent_color) > 0.6 ? '#000' : '#fff',
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
          heading_color: d.heading_color || d.text_color || DEFAULT_THEME.heading_color,
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

        // Auto-expand advanced if hotel has non-default advanced settings
        const hasCustomAdvanced =
          (d.card_radius && d.card_radius !== DEFAULT_THEME.card_radius) ||
          (d.widget_section_padding && d.widget_section_padding !== DEFAULT_THEME.widget_section_padding && d.widget_section_padding !== '0') ||
          (d.widget_grid_gap && d.widget_grid_gap !== DEFAULT_THEME.widget_grid_gap) ||
          (d.widget_grid_min_width && d.widget_grid_min_width !== DEFAULT_THEME.widget_grid_min_width);
        if (hasCustomAdvanced) setAdvancedOpen(true);
      }

      setLoading(false);
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
            heading_color: newTheme.heading_color,
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

        if (initialLoadRef.current) return next;

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
      {/* Autosave indicator */}
      {saveStatus !== 'idle' && (
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
        {/* Header - only when standalone */}
        {!embedded && (
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-foreground">Widget Style</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Match the widget to your hotel&rsquo;s website. Changes save automatically.
            </p>
          </div>
        )}

        {/* Two-column: Controls + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ─── Controls Column ─── */}
          <div className="lg:col-span-3 space-y-5">

            {/* ── BRAND ── */}
            <section className="space-y-3">
              <SectionLabel>Brand</SectionLabel>

              {/* Colors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ColorPicker
                  label="Accent"
                  value={theme.accent_color}
                  onChange={(v) => updateField('accent_color', v)}
                />
                <ColorPicker
                  label="Headings"
                  value={theme.heading_color}
                  onChange={(v) => updateField('heading_color', v)}
                />
                <ColorPicker
                  label="Body text"
                  value={theme.text_color}
                  onChange={(v) => updateField('text_color', v)}
                />
                <ColorPicker
                  label="Background"
                  value={theme.background_color}
                  onChange={(v) => updateField('background_color', v)}
                />
              </div>

              {/* Fonts — heading with weight, body */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Heading font</Label>
                  <div className="flex gap-1.5">
                    <Select
                      value={theme.heading_font_family}
                      onValueChange={(v) => updateField('heading_font_family', v)}
                    >
                      <SelectTrigger className="h-7 flex-1">
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
                    <Select
                      value={theme.heading_font_weight}
                      onValueChange={(v) => updateField('heading_font_weight', v)}
                    >
                      <SelectTrigger className="h-7 w-[100px]">
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
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Body font</Label>
                  <Select
                    value={theme.body_font_family}
                    onValueChange={(v) => updateField('body_font_family', v)}
                  >
                    <SelectTrigger className="h-7">
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
              </div>

              {/* Card corners — visual inline selector */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Card corners</Label>
                <div className="flex gap-1.5">
                  {RADIUS_OPTIONS.map((r) => {
                    const isActive = theme.card_radius === r.value;
                    return (
                      <Tooltip key={r.value}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => updateField('card_radius', r.value)}
                            className={`flex items-center justify-center w-8 h-8 rounded-sm transition-ui ${
                              isActive
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-[rgba(242,241,238,0.6)] border border-transparent hover:border-border'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 ${isActive ? 'bg-primary/30 border-primary/40' : 'bg-muted-foreground/15 border-border'} border`}
                              style={{ borderRadius: r.value }}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{r.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* ── CONTENT ── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Content</SectionLabel>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Show title</span>
                  <Switch
                    checked={theme.widget_title_enabled}
                    onCheckedChange={(v) => updateField('widget_title_enabled', v)}
                  />
                </div>
              </div>

              {theme.widget_title_enabled && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Title</Label>
                      <Input
                        value={theme.widget_title}
                        onChange={(e) => updateField('widget_title', e.target.value)}
                        className="h-7"
                        placeholder="Local Experiences"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px] text-muted-foreground">Subtitle</Label>
                        <Help tip="Use {{hotel_name}} to insert your hotel name automatically" />
                      </div>
                      <Input
                        value={theme.widget_subtitle}
                        onChange={(e) => updateField('widget_subtitle', e.target.value)}
                        className="h-7"
                        placeholder="Curated by {{hotel_name}}"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Alignment</Label>
                      <AlignmentToggle
                        value={theme.widget_text_align}
                        onChange={(v) => updateField('widget_text_align', v)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="border-t border-border" />

            {/* ── FINE-TUNE (collapsible) ── */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Fine-tune
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Spacing, sizes &amp; layout
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground/50 ml-auto transition-transform ${
                      advancedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="pt-3 space-y-3">
                  {/* Row 1: Title size + Base font size */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px] text-muted-foreground">Title size</Label>
                        <Help tip="Font size of the widget heading" />
                      </div>
                      <Select
                        value={theme.title_font_size}
                        onValueChange={(v) => updateField('title_font_size', v)}
                      >
                        <SelectTrigger className="h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TITLE_SIZE_PRESETS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px] text-muted-foreground">Base font</Label>
                        <Help tip="Base size in px — all other text scales from this" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min="12"
                          max="24"
                          value={theme.font_size_base}
                          onChange={(e) => updateField('font_size_base', e.target.value)}
                          className="h-7 flex-1"
                        />
                        <span className="text-[11px] text-muted-foreground">px</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px] text-muted-foreground">Card width</Label>
                        <Help tip="Min width per card — narrower means more columns" />
                      </div>
                      <Select
                        value={theme.widget_grid_min_width}
                        onValueChange={(v) => updateField('widget_grid_min_width', v)}
                      >
                        <SelectTrigger className="h-7">
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

                  {/* Row 2: Spacing controls */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px] text-muted-foreground">Section padding</Label>
                      </div>
                      <Select
                        value={theme.widget_section_padding}
                        onValueChange={(v) => updateField('widget_section_padding', v)}
                      >
                        <SelectTrigger className="h-7">
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

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Title spacing</Label>
                      <Select
                        value={theme.widget_title_margin}
                        onValueChange={(v) => updateField('widget_title_margin', v)}
                      >
                        <SelectTrigger className="h-7">
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

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Card gap</Label>
                      <Select
                        value={theme.widget_grid_gap}
                        onValueChange={(v) => updateField('widget_grid_gap', v)}
                      >
                        <SelectTrigger className="h-7">
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

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Button spacing</Label>
                      <Select
                        value={theme.widget_cta_margin}
                        onValueChange={(v) => updateField('widget_cta_margin', v)}
                      >
                        <SelectTrigger className="h-7">
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
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ─── Preview Column ─── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Preview
                </p>
                {hotelSlug && (
                  <a
                    href={`${WIDGET_BASE_URL}/${hotelSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:text-primary/80 transition-ui flex items-center gap-1"
                  >
                    Full page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <LivePreview theme={theme} hotelName={hotelName} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
