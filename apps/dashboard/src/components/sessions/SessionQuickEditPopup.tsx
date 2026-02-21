import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Euro, Globe, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, getUnitLabel, getDefaultUnitPrice } from '@/lib/pricing';
import { getLanguageName } from '@/components/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import type { SessionWithExperience } from '@/hooks/useAllSessions';

interface SessionQuickEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionWithExperience | null;
  position?: { x: number; y: number };
  onSessionUpdate?: () => void;
  onDuplicate?: (session: SessionWithExperience) => void;
}

export function SessionQuickEditPopup({
  isOpen,
  onClose,
  session,
  position,
  onSessionUpdate,
  onDuplicate,
}: SessionQuickEditPopupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const popupRef = useRef<HTMLDivElement>(null);
  const hasPositioned = useRef(false);

  // Edit state
  const [editingField, setEditingField] = useState<'price' | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [pendingReservationCount, setPendingReservationCount] = useState(0);

  const isBooked = session?.session_status === 'booked';
  const isCancelled = session?.session_status === 'cancelled';
  const pricingType = (session?.experience as any)?.pricing_type || 'per_person';
  const experiencePrice = (() => {
    const exp = session?.experience as any;
    if (!exp) return 0;
    switch (pricingType) {
      case 'per_person': return exp.extra_person_cents || exp.price_cents || 0;
      case 'flat_rate': return exp.base_price_cents || exp.price_cents || 0;
      case 'base_plus_extra': return exp.base_price_cents || exp.price_cents || 0;
      case 'per_day': return exp.price_per_day_cents || exp.extra_person_cents || exp.price_cents || 0;
      default: return exp.price_cents || 0;
    }
  })();
  const currentPrice = session?.price_override_cents !== null ? session?.price_override_cents : experiencePrice;
  const unitLabel = getUnitLabel(pricingType);

  // Reset edit state on open
  useEffect(() => {
    if (isOpen && session) {
      setEditingField(null);
      setEditPrice(session.price_override_cents !== null ? (session.price_override_cents / 100).toString() : '');
    }
  }, [isOpen, session?.id]);

  // Reset positioning flag when popup closes
  useEffect(() => {
    if (!isOpen) hasPositioned.current = false;
  }, [isOpen]);

  // Position popup — useLayoutEffect prevents visible flicker
  useLayoutEffect(() => {
    if (isOpen && position && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = position.x - 150;
      let y = position.y + 10;

      if (x + rect.width > vw - 16) x = vw - rect.width - 16;
      if (y + rect.height > vh - 16) y = position.y - rect.height - 10;
      if (x < 16) x = 16;
      if (y < 16) y = 16;

      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;

      if (!hasPositioned.current) {
        hasPositioned.current = true;
        popup.style.opacity = '1';
      }
    }
  }, [isOpen, position, editingField]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !session) return null;

  const handleSavePrice = async () => {
    setSaving(true);
    try {
      const priceOverrideCents = editPrice ? Math.round(parseFloat(editPrice) * 100) : null;
      const { error } = await supabase
        .from('experience_sessions')
        .update({
          price_override_cents: priceOverrideCents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (error) throw error;
      toast({ title: 'Price updated' });
      setEditingField(null);
      onSessionUpdate?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('experience_sessions')
        .update({ session_status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', session.id);

      if (error) throw error;
      toast({ title: 'Session cancelled' });
      setShowCancelConfirm(false);
      onSessionUpdate?.();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const checkPendingReservations = async () => {
    if (!session) return;
    const { count } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .in('reservation_status', ['pending', 'approved']);
    setPendingReservationCount(count || 0);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      if (pendingReservationCount > 0) {
        const { error: declineErr } = await supabase
          .from('reservations')
          .update({ reservation_status: 'declined', updated_at: new Date().toISOString() })
          .eq('session_id', session.id)
          .in('reservation_status', ['pending', 'approved']);
        if (declineErr) throw declineErr;
      }

      const { error } = await supabase
        .from('experience_sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;
      toast({ title: 'Session deleted' });
      setShowDeleteConfirm(false);
      onSessionUpdate?.();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "h-8 rounded-sm bg-[rgba(242,241,238,0.6)] border-0 focus-visible:ring-1 focus-visible:ring-primary/30";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        ref={popupRef}
        className="fixed z-50 w-72 bg-background border border-border rounded-lg shadow-lg"
        style={{
          left: position?.x ?? '50%',
          top: position?.y ?? '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
          opacity: position ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="font-medium text-sm truncate min-w-0">
            {session.experience?.title || 'Session'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Date & Time */}
          <div className="text-sm">
            <span className="font-medium">{format(parseLocalDate(session.session_date), 'd.M.yyyy')}</span>
            <span className="text-muted-foreground ml-2">{session.start_time.slice(0, 5)}</span>
          </div>

          {/* Language — only if set */}
          {(session as any).session_language && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>{getLanguageName((session as any).session_language)}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-3.5 h-3.5 text-muted-foreground" />
            {editingField === 'price' ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder={(experiencePrice / 100).toFixed(0)}
                  className={cn(inputClass, "w-16 text-xs")}
                  autoFocus
                />
                <span className="text-xs text-muted-foreground">{unitLabel}</span>
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={handleSavePrice} disabled={saving}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setEditingField(null)}>
                  ×
                </Button>
              </div>
            ) : (
              <>
                <span>
                  <span className="font-medium">{formatPrice(currentPrice || 0)}</span>
                  <span className="text-muted-foreground">{unitLabel}</span>
                </span>
                {session.price_override_cents !== null && (
                  <span className="text-[10px] text-muted-foreground">(custom)</span>
                )}
                {!isCancelled && (
                  <button
                    onClick={() => {
                      setEditPrice(session.price_override_cents !== null ? (session.price_override_cents / 100).toString() : '');
                      setEditingField('price');
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                )}
              </>
            )}
          </div>

          {/* Status context — only when meaningful */}
          {isBooked && (
            <button
              onClick={() => navigate(`/supplier/bookings?tab=upcoming`)}
              className="text-xs text-primary hover:underline text-left"
            >
              View booking details
            </button>
          )}
          {isCancelled && (
            <div className="text-xs text-muted-foreground italic">
              This session has been cancelled
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-border">
            {onDuplicate && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                title="Duplicate session"
                onClick={() => onDuplicate(session)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
            <div className="flex-1" />
            {!isCancelled && (
              isBooked ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={checkPendingReservations}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel session?</AlertDialogTitle>
            <AlertDialogDescription>
              This session has a booking. The guest will be notified and refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={saving}>
              {saving ? 'Cancelling...' : 'Cancel Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { setShowDeleteConfirm(open); if (!open) { setDeleteConfirmText(''); setPendingReservationCount(0); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingReservationCount > 0
                ? `This session has ${pendingReservationCount} pending ${pendingReservationCount === 1 ? 'request' : 'requests'}. Deleting will decline ${pendingReservationCount === 1 ? 'it' : 'them'} and remove the session permanently.`
                : 'This will permanently remove this session. This action cannot be undone.'
              }
              {' '}Type <strong>delete</strong> below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Type delete to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="mt-2"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving || deleteConfirmText !== 'delete'}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
