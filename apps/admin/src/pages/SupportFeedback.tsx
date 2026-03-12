import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminJson } from '@/lib/adminApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquare,
  ArrowLeft,
  Download,
  Paperclip,
  Check,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackListItem {
  id: string;
  created_at: string;
  sender_email: string;
  message_preview: string;
  status: string;
  partner_id: string | null;
  partner_name: string | null;
  attachment_count: number;
}

interface FeedbackAttachment {
  filename: string;
  storage_path: string;
  url: string | null;
}

interface FeedbackDetail {
  id: string;
  created_at: string;
  sender_email: string;
  user_id: string | null;
  partner_id: string | null;
  partner_name: string | null;
  message: string;
  status: string;
  attachments: FeedbackAttachment[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'New', variant: 'default' },
  read: { label: 'Read', variant: 'secondary' },
  replied: { label: 'Replied', variant: 'outline' },
};

export default function SupportFeedback() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <FeedbackDetailView id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return <FeedbackListView onSelect={setSelectedId} />;
}

function FeedbackListView({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-support-feedback'],
    queryFn: () => fetchAdminJson<FeedbackListItem[]>('/api/admin/support-feedback'),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Support feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Messages from dashboard users. Click to view full message and attachments.
        </p>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No feedback yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const sc = statusConfig[item.status] ?? statusConfig.new;
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => onSelect(item.id)}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {item.sender_email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {item.message_preview}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.partner_name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="text-xs">
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.attachment_count > 0 && (
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {items.length} {items.length === 1 ? 'message' : 'messages'}
      </p>
    </div>
  );
}

function FeedbackDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-support-feedback-detail', id],
    queryFn: () => fetchAdminJson<FeedbackDetail>(`/api/admin/support-feedback/${id}`),
  });

  const markStatus = async (status: string) => {
    try {
      await fetchAdminJson(`/api/admin/support-feedback/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-support-feedback-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-feedback'] });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (isLoading || !detail) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const sc = statusConfig[detail.status] ?? statusConfig.new;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back
      </Button>

      <Card className="border border-border">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{detail.sender_email}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(detail.created_at), 'dd.MM.yyyy HH:mm')}
                {detail.partner_name && (
                  <span className="ml-2">{detail.partner_name}</span>
                )}
              </p>
            </div>
            <Badge variant={sc.variant} className="text-xs flex-shrink-0">
              {sc.label}
            </Badge>
          </div>

          {/* Message */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {detail.message}
            </p>
          </div>

          {/* Attachments */}
          {detail.attachments.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Attachments
              </p>
              <div className="space-y-1.5">
                {detail.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground truncate">{att.filename}</span>
                    {att.url && (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex-shrink-0 inline-flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-border pt-4 flex items-center gap-2">
            {detail.status === 'new' && (
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => markStatus('read')}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark as read
              </Button>
            )}
            {detail.status !== 'replied' && (
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => markStatus('replied')}>
                <Mail className="h-3.5 w-3.5 mr-1" />
                Mark as replied
              </Button>
            )}
            <a
              href={`mailto:${detail.sender_email}`}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Reply via email
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
