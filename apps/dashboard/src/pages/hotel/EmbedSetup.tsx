import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Check,
  Copy,
  Code,
  Link as LinkIcon,
  Eye,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Info,
} from 'lucide-react';

// ── Widget base URL ──
const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.traverum.com';

function CopyBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className={`h-7 transition-ui ${
            copied
              ? 'bg-success/10 text-[#6B8E6B] hover:bg-success/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-sm overflow-x-auto text-xs font-mono leading-relaxed border border-border">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface EmbedSetupProps {
  embedded?: boolean;
}

export default function EmbedSetup({ embedded = false }: EmbedSetupProps) {
  const { activePartner, isLoading: partnerLoading } = useActivePartner();
  const { activeHotelConfig: hotelConfig, activeHotelConfigId, isLoading: configLoading } = useActiveHotelConfig();
  const [showCustomization, setShowCustomization] = useState(false);

  if (partnerLoading || configLoading || !activePartner) {
    return (
      <div className={embedded ? 'flex items-center justify-center py-8' : 'container max-w-6xl mx-auto px-4 py-6 flex items-center justify-center'}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hotelConfig) {
    return (
      <div className={embedded ? 'text-center py-8' : 'container max-w-6xl mx-auto px-4 py-6'}>
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-xl font-semibold text-foreground mb-2">No Hotel Property</h1>
          <p className="text-sm text-muted-foreground">
            You need a hotel property set up before you can embed the widget.
          </p>
        </div>
      </div>
    );
  }

  const hotelSlug = hotelConfig.slug;
  const baseUrl = WIDGET_BASE_URL;

  const embedCode = `<!-- Traverum Experiences Widget -->
<traverum-widget hotel="${hotelSlug}" max="3"></traverum-widget>
<script src="${baseUrl}/embed.js" async></script>`;

  const fullPageUrl = `${baseUrl}/${hotelSlug}`;

  const cssOverrideExample = `traverum-widget {
  --trv-accent: #8B4513;
  --trv-font-heading: 'Playfair Display', serif;
}`;

  return (
    <div className={embedded ? '' : 'container max-w-6xl mx-auto px-4 py-6'}>
      <div className={embedded ? 'space-y-4' : 'max-w-3xl mx-auto space-y-4'}>
          {/* Header - hidden when embedded in tabs */}
          {!embedded && (
            <div>
              <h1 className="text-xl font-semibold text-foreground">Embed Widget</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the experience widget to your website as a native section.
              </p>
            </div>
          )}

          {/* How it works - Visual steps */}
          <Card className="border border-border">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-medium text-foreground">How it works</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Paste code', desc: 'Add snippet to any page' },
                  { step: '2', title: 'Section appears', desc: 'Styled to your brand' },
                  { step: '3', title: 'Guests book', desc: 'Cards open booking page' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Section 1: Embed Code ── */}
          <Card className="border border-border">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-sm bg-primary/10">
                  <Code className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-medium text-foreground">Embed Code</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Paste this into any page on your website</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <CopyBlock code={embedCode} label="HTML snippet" />

              {/* WordPress alternative */}
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-ui">
                  WordPress alternative (if custom element is stripped)
                </summary>
                <div className="mt-2">
                  <CopyBlock
                    code={`<!-- WordPress-friendly version (if custom element is stripped) -->
<div data-traverum-hotel="${hotelSlug}" data-max="3"></div>
<script src="${baseUrl}/embed.js" async></script>`}
                    label="WordPress fallback"
                  />
                </div>
              </details>

              {/* CMS hints - Visual badges */}
              <div className="flex flex-wrap gap-2">
                <div className="px-2 py-1 rounded-sm bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">WordPress:</span> Custom HTML block
                  </p>
                </div>
                <div className="px-2 py-1 rounded-sm bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Squarespace/Wix:</span> Code block
                  </p>
                </div>
              </div>

              {/* Customization - Collapsible */}
              <div>
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-ui"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${showCustomization ? 'rotate-90' : ''}`}
                  />
                  Customization
                </button>

                {showCustomization && (
                  <div className="mt-3 pl-4 space-y-3 border-l-2 border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">
                        Show more experiences
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Change <code className="bg-muted px-1 py-0.5 rounded-sm text-xs font-mono">max="3"</code> to
                        any number.
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Hide title</p>
                      <p className="text-xs text-muted-foreground">
                        Add <code className="bg-muted px-1 py-0.5 rounded-sm text-xs font-mono">hide-title</code> to
                        the tag.
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Custom button</p>
                      <p className="text-xs text-muted-foreground">
                        Add{' '}
                        <code className="bg-muted px-1 py-0.5 rounded-sm text-xs font-mono">
                          button-label="View all"
                        </code>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">CSS override</p>
                      <CopyBlock code={cssOverrideExample} label="CSS example" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Section 2: Direct Link ── */}
          <Card className="border border-border">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-sm bg-primary/10">
                  <LinkIcon className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-medium text-foreground">Direct Booking Link</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Share in emails, QR codes, or navigation menus</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <CopyBlock code={fullPageUrl} label="Full booking page URL" />
            </CardContent>
          </Card>

          {/* ── Section 3: Preview ── */}
          <Card className="border border-border">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-primary/10">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-medium text-foreground">Live Preview</h2>
                </div>
                <a
                  href={fullPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-ui"
                >
                  Open full page
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="border border-border rounded-sm overflow-hidden bg-background p-4">
                <WidgetPreview baseUrl={baseUrl} hotelSlug={hotelSlug} />
              </div>
            </CardContent>
          </Card>

          {/* Technical details - Compact list */}
          <Card className="border border-border bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Technical Details
              </h3>
              <ul className="space-y-2">
                {[
                  'Shadow DOM isolation — styles never conflict',
                  'Lightweight — ~15 KB gzipped, no framework',
                  'Native section — real HTML, no iframe',
                  'Auto-themed — matches your brand settings',
                  'Works everywhere — WordPress, Squarespace, Wix, Shopify',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-[#6B8E6B] mt-0.5 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

/* ── Live preview via srcDoc iframe ── */
function WidgetPreview({ baseUrl, hotelSlug }: { baseUrl: string; hotelSlug: string }) {
  const srcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{margin:0;padding:0;font-family:system-ui,sans-serif;background:transparent}</style>
</head>
<body>
  <traverum-widget hotel="${hotelSlug}" max="3"></traverum-widget>
  <script src="${baseUrl}/embed.js"><\/script>
  <script>
    function sendH(){var h=document.documentElement.scrollHeight;window.parent.postMessage({type:'trv-preview-h',height:h},'*')}
    new MutationObserver(sendH).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',sendH);
    setTimeout(sendH,1000);setTimeout(sendH,3000);
  <\/script>
</body>
</html>`;

  return (
    <>
      <iframe
        srcDoc={srcDoc}
        title="Widget Preview"
        className="w-full border-0 transition-ui"
        style={{ minHeight: '320px' }}
        loading="lazy"
        id="trv-preview-frame"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('message',function(e){
              if(e.data&&e.data.type==='trv-preview-h'&&typeof e.data.height==='number'){
                var f=document.getElementById('trv-preview-frame');
                if(f)f.style.height=Math.max(300,e.data.height+20)+'px';
              }
            });
          `,
        }}
      />
    </>
  );
}
