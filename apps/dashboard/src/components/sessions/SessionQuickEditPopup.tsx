import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Users, Euro, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing';
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
}

export function SessionQuickEditPopup({
  isOpen,
  onClose,
  session,
  position,
  onSessionUpdate,
}: SessionQuickEditPopupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const popupRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [editingField, setEditingField] = useState<'spots' | 'price' | null>(null);
  const [editSpots, setEditSpots] = useState(0);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const bookingsCount = session ? session.spots_total - session.spots_available : 0;
  const isCancelled = session?.session_status === 'cancelled';
  const experiencePrice = session?.experience?.price_cents || 0;
  const currentPrice = session?.price_override_cents !== null ? session?.price_override_cents : experiencePrice;

  // Reset edit state on open
  useEffect(() => {
    if (isOpen && session) {
      setEditingField(null);
      setEditSpots(session.spots_available);
      setEditPrice(session.price_override_cents !== null ? (session.price_override_cents / 100).toString() : '');
    }
  }, [isOpen, session?.id]);

  // Position popup
  useEffect(() => {
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

  const handleSaveSpots = async () => {
    setSaving(true);
    try {
      const newTotal = bookingsCount + editSpots;
      const { error } = await supabase
        .from('experience_sessions')
        .update({
          spots_total: newTotal,
          spots_available: editSpots,
          session_status: editSpots === 0 ? 'full' : 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      if (error) throw error;
      toast({ title: 'Spots updated' });
      setEditingField(null);
      onSessionUpdate?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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

  const handleDelete = async () => {
    setSaving(true);
    try {
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

  const getStatusBadge = () => {
    switch (session.session_status) {
      case 'available':
        return <Badge className="bg-success/10 text-success hover:bg-success/20 text-[10px] h-5">Available</Badge>;
      case 'full':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 text-[10px] h-5">Full</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="text-[10px] h-5">Cancelled</Badge>;
      default:
        return null;
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
          left: position?.x || '50%',
          top: position?.y || '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">
              {session.experience?.title || 'Session'}
            </span>
            {getStatusBadge()}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          {/* Date & Time */}
          <div className="text-sm">
            <span className="font-medium">{format(new Date(session.session_date), 'EEE, d MMM yyyy')}</span>
            <span className="text-muted-foreground ml-2">{session.start_time.slice(0, 5)}</span>
          </div>

          {/* Capacity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              {editingField === 'spots' ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={editSpots}
                    onChange={(e) => setEditSpots(parseInt(e.target.value) || 0)}
                    className={cn(inputClass, "w-16 text-xs")}
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">avail</span>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={handleSaveSpots} disabled={saving}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setEditingField(null)}>
                    ×
                  </Button>
                </div>
              ) : (
                <>
                  <span>
                    <span className="font-medium">{bookingsCount}</span>
                    <span className="text-muted-foreground">/{session.spots_total} booked</span>
                  </span>
                  {!isCancelled && (
                    <button
                      onClick={() => {
                        setEditSpots(session.spots_available);
                        setEditingField('spots');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
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
                  <span className="text-xs text-muted-foreground">/person</span>
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
                    <span className="text-muted-foreground">/person</span>
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={() => navigate(`/supplier/bookings?session=${session.id}`)}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Full Details
            </Button>
            {!isCancelled && (
              bookingsCount > 0 ? (
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
                  onClick={() => setShowDeleteConfirm(true)}
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
              This session has {bookingsCount} guest{bookingsCount !== 1 ? 's' : ''} booked.
              They will be notified and refunded.
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
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
