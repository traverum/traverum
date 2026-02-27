import { useState } from 'react';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Code, Link as LinkIcon, Globe } from 'lucide-react';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.veyond.eu';

function CopyBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
      <pre className="bg-[rgba(242,241,238,0.6)] text-foreground p-4 rounded-sm overflow-x-auto text-xs font-mono leading-relaxed border border-border">
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
  const { activeHotelConfig: hotelConfig, isLoading: configLoading } = useActiveHotelConfig();

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

  const embedCode = `<!-- Veyond Experiences Widget -->
<veyond-widget hotel="${hotelSlug}"></veyond-widget>
<script src="${baseUrl}/embed.js" async></script>`;

  const fullPageUrl = `${baseUrl}/${hotelSlug}`;
  const iframeEmbedUrl = `${baseUrl}/embed/${hotelSlug}`;

  const resizeScript = `<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'veyond-resize') {
    document.querySelectorAll('iframe[src*="book.veyond.eu"]').forEach(function(f) {
      f.style.height = e.data.height + 'px';
    });
  }
});
</script>`;

  return (
    <div className={embedded ? '' : 'container max-w-6xl mx-auto px-4 py-6'}>
      <div className={embedded ? 'space-y-4' : 'max-w-2xl space-y-4'}>
        {!embedded && <h1 className="text-xl font-semibold text-foreground">Embed</h1>}

        <Card className="border border-border">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-foreground">Embed Code</h2>
            </div>
            <CopyBlock code={embedCode} label="HTML snippet" />
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-foreground">Direct Link</h2>
            </div>
            <CopyBlock code={fullPageUrl} label="URL" />
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-foreground">Wix & Page Builders</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              For platforms that use iframes (Wix, etc.). Paste the URL below into Wix's Custom HTML component using "Website address" mode.
            </p>
            <CopyBlock code={iframeEmbedUrl} label="Embed URL" />
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                To enable auto-height, add this script via Wix Settings &rarr; Custom Code &rarr; Head:
              </p>
              <CopyBlock code={resizeScript} label="Auto-height script (paste in site head)" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
