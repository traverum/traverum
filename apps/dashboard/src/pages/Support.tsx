import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { getSupportToastOptionsSonner } from '@/lib/support';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.veyond.eu';

const SUPPORT_EMAIL = 'info@traverum.com';

export default function Support() {
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter your message.');
      return;
    }
    if (!session?.access_token) {
      toast.error('Please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('message', message.trim());
      files.forEach((file) => formData.append('attachments', file));

      const res = await fetch(`${WIDGET_BASE_URL}/api/support`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      toast.success('Email sent. We will reply within 24 hours.');
      setMessage('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Support submit error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send. Try emailing us directly.', getSupportToastOptionsSonner());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Your message goes to{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-foreground font-medium hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          . We reply within 24 hours, in any language.
        </p>

        {/* Chat-style input box */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-0">
            <textarea
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[120px]"
              disabled={submitting}
            />
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-[rgba(242,241,238,0.4)]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="support-attachments"
                disabled={submitting}
              />
              <label
                htmlFor="support-attachments"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {files.length > 0 ? `${files.length} image${files.length !== 1 ? 's' : ''}` : 'Attach images'}
              </label>
              <Button
                type="submit"
                disabled={submitting || !message.trim()}
                size="sm"
                className="h-8 gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send email
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
