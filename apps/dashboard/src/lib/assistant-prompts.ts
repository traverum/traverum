export interface PromptContext {
  partnerName: string;
  isSupplier: boolean;
  isHotel: boolean;
  guestsServedThisMonth: number;
  travelersGuidedThisMonth: number;
  pendingRequestCount: number;
  hasStripe: boolean;
  stripeStatus: string | null;
  experienceCount: number;
  hotelConfigCount: number;
}

export interface AssistantPrompt {
  id: string;
  label: string;
  labelByLocale?: Record<string, string>;
  answer: string;
  answerByLocale?: Record<string, string>;
  condition?: (ctx: PromptContext) => boolean;
  navigateTo?: string;
  tier: 'top' | 'highlight' | 'always' | 'contextual';
}

// ---------------------------------------------------------------------------
// Greeting templates
// ---------------------------------------------------------------------------

type GreetingBuilder = (ctx: PromptContext & { salutation: string }) => string;

function salutation(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const greetings: Record<string, GreetingBuilder> = {
  en: (ctx) => {
    const part = ctx.salutation === 'morning' ? 'Good morning' : ctx.salutation === 'afternoon' ? 'Good afternoon' : 'Good evening';
    const lines: string[] = [`${part}, ${ctx.partnerName}.`];

    if (ctx.isSupplier && ctx.guestsServedThisMonth > 0) {
      lines.push(`You've served ${ctx.guestsServedThisMonth} guest${ctx.guestsServedThisMonth === 1 ? '' : 's'} this month.`);
    }
    if (ctx.isHotel && ctx.travelersGuidedThisMonth > 0) {
      lines.push(`You've guided ${ctx.travelersGuidedThisMonth} traveler${ctx.travelersGuidedThisMonth === 1 ? '' : 's'} to local experiences this month.`);
    }
    if (ctx.pendingRequestCount > 0) {
      lines.push(`You have ${ctx.pendingRequestCount} booking request${ctx.pendingRequestCount === 1 ? '' : 's'} waiting for your response.`);
    }
    if (ctx.isSupplier && !ctx.hasStripe) {
      lines.push('Connect Stripe to start receiving payments.');
    }
    if (lines.length === 1) {
      lines.push('How can I help you today?');
    }
    return lines.join('\n');
  },

  it: (ctx) => {
    const part = ctx.salutation === 'morning' ? 'Buongiorno' : ctx.salutation === 'afternoon' ? 'Buon pomeriggio' : 'Buonasera';
    const lines: string[] = [`${part}, ${ctx.partnerName}.`];

    if (ctx.isSupplier && ctx.guestsServedThisMonth > 0) {
      lines.push(`Hai servito ${ctx.guestsServedThisMonth} ospite${ctx.guestsServedThisMonth === 1 ? '' : 'i'} questo mese.`);
    }
    if (ctx.isHotel && ctx.travelersGuidedThisMonth > 0) {
      lines.push(`Hai guidato ${ctx.travelersGuidedThisMonth} viaggiator${ctx.travelersGuidedThisMonth === 1 ? 'e' : 'i'} verso esperienze locali questo mese.`);
    }
    if (ctx.pendingRequestCount > 0) {
      lines.push(`Hai ${ctx.pendingRequestCount} richiest${ctx.pendingRequestCount === 1 ? 'a' : 'e'} di prenotazione in attesa.`);
    }
    if (ctx.isSupplier && !ctx.hasStripe) {
      lines.push('Collega Stripe per iniziare a ricevere pagamenti.');
    }
    if (lines.length === 1) {
      lines.push('Come posso aiutarti oggi?');
    }
    return lines.join('\n');
  },

  de: (ctx) => {
    const part = ctx.salutation === 'morning' ? 'Guten Morgen' : ctx.salutation === 'afternoon' ? 'Guten Tag' : 'Guten Abend';
    const lines: string[] = [`${part}, ${ctx.partnerName}.`];

    if (ctx.isSupplier && ctx.guestsServedThisMonth > 0) {
      lines.push(`Du hast diesen Monat ${ctx.guestsServedThisMonth} Gast${ctx.guestsServedThisMonth === 1 ? '' : 'e'} betreut.`);
    }
    if (ctx.isHotel && ctx.travelersGuidedThisMonth > 0) {
      lines.push(`Du hast ${ctx.travelersGuidedThisMonth} Reisende${ctx.travelersGuidedThisMonth === 1 ? 'n' : ''} zu lokalen Erlebnissen geführt.`);
    }
    if (ctx.pendingRequestCount > 0) {
      lines.push(`Du hast ${ctx.pendingRequestCount} Buchungsanfrage${ctx.pendingRequestCount === 1 ? '' : 'n'} offen.`);
    }
    if (ctx.isSupplier && !ctx.hasStripe) {
      lines.push('Verbinde Stripe, um Zahlungen zu erhalten.');
    }
    if (lines.length === 1) {
      lines.push('Wie kann ich dir heute helfen?');
    }
    return lines.join('\n');
  },
};

export function buildGreeting(ctx: PromptContext, locale: string): string {
  const key = locale.split('-')[0].toLowerCase();
  const builder = greetings[key] || greetings.en;
  return builder({ ...ctx, salutation: salutation() });
}

// ---------------------------------------------------------------------------
// Prompt definitions
// ---------------------------------------------------------------------------

export const ASSISTANT_PROMPTS: AssistantPrompt[] = [
  // ── Top (very first) ───────────────────────────────────────────────────
  {
    id: 'contact-human',
    tier: 'top',
    label: 'Contact a human',
    labelByLocale: { it: 'Contatta un operatore', de: 'Mensch kontaktieren' },
    navigateTo: '/support',
    answer: '',
  },

  // ── Highlight (most important: grow the network) ────────────────────────
  {
    id: 'recommend-us',
    tier: 'highlight',
    label: 'Help grow the network — recommend us',
    labelByLocale: {
      it: 'Aiuta a far crescere la rete — consigliaci',
      de: 'Hilf uns, das Netzwerk zu vergrößern — empfiehl uns',
    },
    answer: `Hotels and experience providers help each other when they both use Veyond.\n\n**If you are a supplier (experience provider):**\nRecommend Veyond to hotels you work with or would like to work with. When a hotel embeds our widget, their guests see your experiences and can book you directly — you get more bookings with no extra marketing. The hotel earns commission and you get more visibility. Everyone wins.\n\n**If you are a hotel:**\nRecommend Veyond to local experience providers — tour guides, cooking classes, rentals, activities. The more providers on the platform, the more choice your guests have and the more commission you can earn. Providers get a simple way to reach your guests; you offer a better stay.\n\n**How to recommend us:**\nContact us at info@traverum.com to introduce partners. We handle onboarding and support. The more hotels and providers in the network, the better it is for everyone.\n\nQuestions? [Contact us](/support) — we're happy to help.`,
    answerByLocale: {
      it: `Hotel e fornitori di esperienze si aiutano a vicenda quando usano entrambi Veyond.\n\n**Se sei un fornitore (esperienze):**\nConsiglia Veyond agli hotel con cui lavori o vorresti lavorare. Quando un hotel incorpora il nostro widget, i suoi ospiti vedono le tue esperienze e possono prenotarti direttamente — più prenotazioni senza marketing. L'hotel guadagna commissioni e tu più visibilità.\n\n**Se sei un hotel:**\nConsiglia Veyond ai fornitori di esperienze locali — guide, corsi di cucina, noleggi, attività. Più fornitori sulla piattaforma, più scelta per i tuoi ospiti e più commissioni per te. I fornitori raggiungono i tuoi ospiti; tu offri un soggiorno migliore.\n\n**Come consigliarci:**\nScrivici a info@traverum.com per presentarci i tuoi partner. Ci occupiamo di onboarding e supporto. Più hotel e fornitori nella rete, meglio è per tutti.\n\nDomande? [Contattaci](/support).`,
    },
  },

  // ── Contextual (shown when conditions match) ──────────────────────────────
  {
    id: 'connect-stripe',
    tier: 'contextual',
    label: 'How do I connect Stripe?',
    labelByLocale: { it: 'Come collego Stripe?', de: 'Wie verbinde ich Stripe?' },
    condition: (ctx) => ctx.isSupplier && !ctx.hasStripe && ctx.stripeStatus !== 'incomplete',
    answer: `To receive payments you need to connect your bank account through Stripe Connect Express. It takes about 10-15 minutes.\n\nPrepare these documents:\n- Valid ID card or passport (front and back)\n- A selfie holding your document\n- Your IBAN\n- If you are a company: VAT number and possibly a chamber of commerce extract\n\nSteps:\n1. Go to your [Experiences dashboard](/supplier/dashboard) and click "Connect Stripe"\n2. Fill in your personal details\n3. Upload your documents (front/back photo + selfie)\n4. Enter your IBAN\n5. Done — 95% of accounts are verified within 24 hours\n\nCommon issues: blurry photo, expired document, IBAN with spaces. Use good lighting for photos and copy your IBAN directly from your banking app.`,
    answerByLocale: {
      it: `Per ricevere i pagamenti devi collegare il tuo conto bancario tramite Stripe Connect Express. Ci vogliono circa 10-15 minuti.\n\nPrepara questi documenti:\n- Carta d'identità o passaporto vigente (fronte/retro)\n- Un selfie con il documento in mano\n- Il tuo IBAN\n- Se sei una SRL/impresa: Partita IVA e visura camerale (se richiesta)\n\nPassi:\n1. Vai alla tua [dashboard esperienze](/supplier/dashboard) e clicca "Connect Stripe"\n2. Compila i dati personali\n3. Carica i documenti (foto fronte/retro + selfie)\n4. Inserisci il tuo IBAN\n5. Fatto — il 95% degli account viene verificato entro 24 ore\n\nProblemi comuni: foto sfocata, documento scaduto, IBAN con spazi. Usa buona luce per le foto e copia l'IBAN direttamente dall'home banking.`,
    },
  },
  {
    id: 'finish-stripe',
    tier: 'contextual',
    label: 'How do I finish Stripe verification?',
    labelByLocale: { it: 'Come completo la verifica Stripe?', de: 'Wie schließe ich die Stripe-Verifizierung ab?' },
    condition: (ctx) => ctx.isSupplier && ctx.stripeStatus === 'incomplete',
    answer: `Stripe needs additional information to verify your account. Common reasons:\n\n- "Document not readable" — retake the photo with better lighting\n- "Selfie not recognized" — face the camera directly, eyes open\n- "IBAN invalid" — copy it from your banking app without spaces\n- "Verification failed" — use a valid, non-expired document\n\nGo to your [Experiences dashboard](/supplier/dashboard) to complete the verification. Most accounts are approved within 24 hours once documents are complete.`,
    answerByLocale: {
      it: `Stripe ha bisogno di informazioni aggiuntive per verificare il tuo account. Motivi comuni:\n\n- "Documento non leggibile" — rifai la foto con più luce\n- "Selfie non riconosciuto" — viso frontale, occhi aperti\n- "IBAN non valido" — copialo dall'home banking senza spazi\n- "Verifica fallita" — usa un documento vigente\n\nVai alla tua [dashboard esperienze](/supplier/dashboard) per completare la verifica. Il 95% degli account viene approvato entro 24 ore con documenti completi.`,
    },
  },
  {
    id: 'first-experience',
    tier: 'contextual',
    label: 'Create your first experience',
    labelByLocale: { it: 'Crea la tua prima esperienza', de: 'Erstelle dein erstes Erlebnis' },
    condition: (ctx) => ctx.isSupplier && ctx.experienceCount === 0,
    answer: `Let's get your first experience published.\n\n1. Click "New experience" in the sidebar (or go to [Experiences](/supplier/dashboard))\n2. Give it a title and description — tell guests what makes it special\n3. Add photos that show the experience in action\n4. Set your pricing model (per person, flat rate, base + extra, or per day for rentals)\n5. Choose a cancellation policy\n6. Publish — your experience is now bookable\n\nAfter publishing, create time slots in the [Calendar](/supplier/sessions) so guests can book specific dates.`,
    answerByLocale: {
      it: `Pubblichiamo la tua prima esperienza.\n\n1. Clicca "Nuova esperienza" nella barra laterale (o vai su [Esperienze](/supplier/dashboard))\n2. Dai un titolo e una descrizione — racconta cosa la rende speciale\n3. Aggiungi foto che mostrano l'esperienza in azione\n4. Imposta il modello di prezzo (a persona, tariffa fissa, base + extra, o al giorno per noleggi)\n5. Scegli la politica di cancellazione\n6. Pubblica — la tua esperienza è ora prenotabile\n\nDopo la pubblicazione, crea le fasce orarie nel [Calendario](/supplier/sessions) per permettere agli ospiti di prenotare.`,
    },
  },
  {
    id: 'first-property',
    tier: 'contextual',
    label: 'Add your first property',
    labelByLocale: { it: 'Aggiungi la tua prima struttura', de: 'Füge deine erste Unterkunft hinzu' },
    condition: (ctx) => ctx.isHotel && ctx.hotelConfigCount === 0,
    answer: `Adding a property lets you earn commission on guest bookings.\n\n1. Click "New property" in the sidebar (or go to [Stays](/hotel/dashboard))\n2. Set the property name and customize the widget appearance\n3. Go to the Widget tab to get your embed code\n4. Paste the snippet into your website — it works with WordPress, Squarespace, Wix, and any CMS\n\nOnce embedded, guests browsing your website can book local experiences directly. You earn commission on every booking automatically.`,
    answerByLocale: {
      it: `Aggiungere una struttura ti permette di guadagnare commissioni sulle prenotazioni degli ospiti.\n\n1. Clicca "Nuova struttura" nella barra laterale (o vai su [Stays](/hotel/dashboard))\n2. Imposta il nome della struttura e personalizza l'aspetto del widget\n3. Vai alla scheda Widget per ottenere il codice embed\n4. Incolla lo snippet nel tuo sito — funziona con WordPress, Squarespace, Wix e qualsiasi CMS\n\nUna volta incorporato, gli ospiti che navigano il tuo sito possono prenotare esperienze locali direttamente. Guadagni commissioni su ogni prenotazione automaticamente.`,
    },
  },
  {
    id: 'pending-requests',
    tier: 'contextual',
    label: 'What are these requests?',
    labelByLocale: { it: 'Cosa sono queste richieste?', de: 'Was sind diese Anfragen?' },
    condition: (ctx) => ctx.pendingRequestCount > 0,
    answer: `A booking request means a guest asked for a custom date, time, or rental. You have 48 hours to respond.\n\n- **Accept** — the guest gets 1 hour to pay. Once paid, the booking is confirmed.\n- **Decline** — the guest is notified and can try a different time.\n\nIf you don't respond within 48 hours, the request expires automatically.\n\nGo to [Bookings](/supplier/bookings?tab=requests) to review your pending requests.`,
    answerByLocale: {
      it: `Una richiesta di prenotazione significa che un ospite ha chiesto una data, un orario o un noleggio personalizzato. Hai 48 ore per rispondere.\n\n- **Accetta** — l'ospite ha 1 ora per pagare. Una volta pagato, la prenotazione è confermata.\n- **Rifiuta** — l'ospite viene notificato e può provare un altro orario.\n\nSe non rispondi entro 48 ore, la richiesta scade automaticamente.\n\nVai su [Prenotazioni](/supplier/bookings?tab=requests) per gestire le richieste in attesa.`,
    },
  },

  // ── Always visible ──────────────────────────────────────────────────────
  {
    id: 'how-it-works',
    tier: 'always',
    label: 'What can I do here?',
    labelByLocale: { it: 'Cosa posso fare qui?', de: 'Was kann ich hier tun?' },
    answer: `Veyond connects experience providers with travelers — through hotel websites and directly through Veyond.\n\n**If you offer experiences:**\n1. Create your experiences and set pricing\n2. Add time slots in the [Calendar](/supplier/sessions)\n3. Guests book and pay online — you get notified by email\n4. After the experience, you get paid automatically\n\nManage everything from:\n- [Calendar](/supplier/sessions) — your schedule and time slots\n- [Bookings](/supplier/bookings) — reservations and requests\n- [Analytics](/supplier/analytics) — revenue, payouts, and reports\n\n**If you are a hotel:**\n1. Add your property and embed the widget on your website\n2. Guests book experiences through your site\n3. You earn commission automatically on every booking\n\nTrack your earnings in [Analytics](/hotel/analytics).`,
    answerByLocale: {
      it: `Veyond collega i fornitori di esperienze con i viaggiatori — tramite i siti degli hotel e direttamente tramite Veyond.\n\n**Se offri esperienze:**\n1. Crea le tue esperienze e imposta i prezzi\n2. Aggiungi le fasce orarie nel [Calendario](/supplier/sessions)\n3. Gli ospiti prenotano e pagano online — ricevi una notifica via email\n4. Dopo l'esperienza, vieni pagato automaticamente\n\nGestisci tutto da:\n- [Calendario](/supplier/sessions) — il tuo programma e le fasce orarie\n- [Prenotazioni](/supplier/bookings) — prenotazioni e richieste\n- [Analytics](/supplier/analytics) — ricavi, pagamenti e report\n\n**Se sei un hotel:**\n1. Aggiungi la tua struttura e incorpora il widget nel tuo sito\n2. Gli ospiti prenotano esperienze tramite il tuo sito\n3. Guadagni commissioni automaticamente su ogni prenotazione\n\nControlla i tuoi guadagni in [Analytics](/hotel/analytics).`,
    },
  },
];

export function getVisiblePrompts(ctx: PromptContext): AssistantPrompt[] {
  return ASSISTANT_PROMPTS.filter((p) => {
    if (p.condition && !p.condition(ctx)) return false;
    return true;
  });
}

export function resolveLocaleText(
  base: string,
  byLocale: Record<string, string> | undefined,
  locale: string,
): string {
  if (!byLocale) return base;
  const key = locale.split('-')[0].toLowerCase();
  return byLocale[key] || base;
}
