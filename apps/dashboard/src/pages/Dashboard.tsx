import { useMemo, useState, useRef, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BusinessDetails } from '@/pages/onboarding/BusinessDetails';
import { useSupplierData } from '@/hooks/useSupplierData';
import { usePendingRequests } from '@/hooks/usePendingRequests';
import { useSupplierAnalytics } from '@/hooks/useSupplierAnalytics';
import { useHotelCommission } from '@/hooks/useHotelCommission';
import { useActiveHotelConfig } from '@/hooks/useActiveHotelConfig';
import { cn } from '@/lib/utils';
import {
  buildGreeting,
  getVisiblePrompts,
  resolveLocaleText,
  type PromptContext,
  type AssistantPrompt,
} from '@/lib/assistant-prompts';

// ---------------------------------------------------------------------------
// Answer renderer: parses [link text](/path) into navigable elements
// ---------------------------------------------------------------------------

type AnswerToken = { type: 'text'; value: string } | { type: 'link'; value: string; href: string } | { type: 'bold'; value: string };

function tokenize(text: string): AnswerToken[] {
  const result: AnswerToken[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      result.push({ type: 'link', value: match[1], href: match[2] });
    } else if (match[3] !== undefined) {
      result.push({ type: 'bold', value: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return result;
}

function RenderedAnswer({ text, onNavigate }: { text: string; onNavigate: (path: string) => void }) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === 'link') {
          return (
            <button
              key={i}
              onClick={() => onNavigate(token.href)}
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors font-medium"
            >
              {token.value}
            </button>
          );
        }
        if (token.type === 'bold') {
          return <strong key={i} className="font-medium">{token.value}</strong>;
        }
        const lines = token.value.split('\n');
        return (
          <Fragment key={i}>
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoading, activePartner, userPartners, capabilities } = useActivePartner();
  const { experiences, hasStripe, stripeStatus } = useSupplierData();
  const { requests: pendingRequests } = usePendingRequests();
  const {
    guestsServedThisMonth = 0,
    isLoading: supplierAnalyticsLoading,
  } = useSupplierAnalytics();
  const {
    travelersGuidedThisMonth = 0,
    isLoading: hotelCommissionLoading,
  } = useHotelCommission();
  const { hotelConfigs } = useActiveHotelConfig();

  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const locale = useMemo(() => navigator.language?.split('-')[0] || 'en', []);

  const ctx: PromptContext = useMemo(() => ({
    partnerName: activePartner?.partner.name ?? 'there',
    isSupplier: capabilities.isSupplier,
    isHotel: capabilities.isHotel,
    guestsServedThisMonth,
    travelersGuidedThisMonth,
    pendingRequestCount: pendingRequests.length,
    hasStripe,
    stripeStatus,
    experienceCount: experiences.length,
    hotelConfigCount: hotelConfigs.length,
  }), [activePartner, capabilities, guestsServedThisMonth, travelersGuidedThisMonth, pendingRequests, hasStripe, stripeStatus, experiences, hotelConfigs]);

  const greeting = useMemo(() => buildGreeting(ctx, locale), [ctx, locale]);

  const visiblePrompts = useMemo(() => getVisiblePrompts(ctx), [ctx]);
  const topPrompts = visiblePrompts.filter((p) => p.tier === 'top');
  const highlightPrompts = visiblePrompts.filter((p) => p.tier === 'highlight');
  const contextualPrompts = visiblePrompts.filter((p) => p.tier === 'contextual');
  const alwaysPrompts = visiblePrompts.filter((p) => p.tier === 'always');

  const primaryPrompts = [...topPrompts, ...highlightPrompts, ...contextualPrompts, ...alwaysPrompts];

  const activePrompt = activePromptId ? visiblePrompts.find((p) => p.id === activePromptId) ?? null : null;

  useEffect(() => {
    if (activePrompt && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePrompt]);

  const handlePromptClick = (prompt: AssistantPrompt) => {
    if (prompt.navigateTo) {
      navigate(prompt.navigateTo);
      return;
    }
    setActivePromptId(prompt.id === activePromptId ? null : prompt.id);
  };

  const dataLoading = supplierAnalyticsLoading || hotelCommissionLoading;

  if (isLoading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (userPartners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BusinessDetails open={true} onOpenChange={() => {}} />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex-1 flex flex-col px-4 py-8">
          <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">

            {/* Greeting bubble — top of page, big, round, green, warm */}
            <div className="flex justify-start animate-fade-in pt-2">
              <div className="max-w-xl bg-primary/15 border border-primary/25 rounded-3xl px-6 py-5 text-base leading-relaxed text-foreground shadow-sm">
                {greeting.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2.5' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Active Q&A — middle, scrolls if needed */}
            {activePrompt && activePrompt.answer && (
              <div ref={answerRef} className="mt-6 space-y-3 animate-fade-in flex-1">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5 text-sm max-w-md">
                    {resolveLocaleText(activePrompt.label, activePrompt.labelByLocale, locale)}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-lg bg-accent rounded-2xl rounded-tl-md px-5 py-4 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    <RenderedAnswer
                      text={resolveLocaleText(activePrompt.answer, activePrompt.answerByLocale, locale)}
                      onNavigate={navigate}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Prompt pills — bottom of page */}
            <div className="mt-auto pt-8 pb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {primaryPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt)}
                    className={cn(
                      'text-left px-4 py-2.5 rounded-full border text-sm transition-all duration-150',
                      'hover:bg-accent hover:scale-[1.01]',
                      activePromptId === prompt.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : prompt.tier === 'highlight'
                          ? 'bg-primary/10 border-primary/40 text-foreground font-medium'
                          : 'bg-background border-border text-foreground'
                    )}
                  >
                    {resolveLocaleText(prompt.label, prompt.labelByLocale, locale)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
