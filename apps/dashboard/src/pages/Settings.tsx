import { useState, useEffect, useCallback } from 'react';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Trash2, Users, Link as LinkIcon, Check, Mail, Building2 } from 'lucide-react';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.veyond.eu';
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || window.location.origin;

interface Member {
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
  is_self: boolean;
}

export default function Settings() {
  const { activePartner, activePartnerId } = useActivePartner();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Organization name
  const [orgName, setOrgName] = useState('');
  const [orgNameSaving, setOrgNameSaving] = useState(false);
  const [orgNameDirty, setOrgNameDirty] = useState(false);

  // Organization email
  const [orgEmail, setOrgEmail] = useState('');
  const [orgEmailSaving, setOrgEmailSaving] = useState(false);
  const [orgEmailDirty, setOrgEmailDirty] = useState(false);

  useEffect(() => {
    if (activePartner?.partner?.name) {
      setOrgName(activePartner.partner.name);
      setOrgNameDirty(false);
    }
    if (activePartner?.partner?.email) {
      setOrgEmail(activePartner.partner.email);
      setOrgEmailDirty(false);
    }
  }, [activePartner?.partner?.name, activePartner?.partner?.email]);

  const isOwner = activePartner?.role === 'owner';

  // Fetch members
  const { data: members = [], isLoading: membersLoading, isError: membersError, refetch: refetchMembers } = useQuery({
    queryKey: ['orgMembers', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId || !session?.access_token) return [];

      const res = await fetch(`${WIDGET_BASE_URL}/api/organizations/${activePartnerId}/members`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to fetch members:', res.status, err);
        throw new Error(err.error || `Failed to fetch members (${res.status})`);
      }
      const data = await res.json();
      return data.members as Member[];
    },
    enabled: !!activePartnerId && !!session?.access_token && isOwner,
    retry: 1,
  });

  const handleGenerateInvite = useCallback(async () => {
    if (!activePartnerId || !session?.access_token) return;
    setInviteLoading(true);
    try {
      const res = await fetch(`${WIDGET_BASE_URL}/api/organizations/${activePartnerId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role: 'owner' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to generate invite link');
        return;
      }

      const data = await res.json();
      setInviteToken(data.token);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setInviteLoading(false);
    }
  }, [activePartnerId, session?.access_token]);

  const inviteUrl = inviteToken ? `${DASHBOARD_URL}/invite/${inviteToken}` : null;

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!activePartnerId || !session?.access_token) return;
    setRemovingUserId(userId);

    try {
      const res = await fetch(`${WIDGET_BASE_URL}/api/organizations/${activePartnerId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to remove member');
        return;
      }

      toast.success(`${email} has been removed`);
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['userPartners'] });
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleSaveOrgName = async () => {
    if (!activePartnerId || !orgName.trim()) {
      toast.error('Organization name cannot be empty');
      return;
    }

    setOrgNameSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ name: orgName.trim() })
        .eq('id', activePartnerId);

      if (error) throw error;

      toast.success('Organization name updated');
      setOrgNameDirty(false);
      queryClient.invalidateQueries({ queryKey: ['userPartners'] });
    } catch {
      toast.error('Failed to update name');
    } finally {
      setOrgNameSaving(false);
    }
  };

  const handleSaveOrgEmail = async () => {
    if (!activePartnerId || !orgEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orgEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setOrgEmailSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ email: orgEmail.trim() })
        .eq('id', activePartnerId);

      if (error) throw error;

      toast.success('Organization email updated');
      setOrgEmailDirty(false);
      queryClient.invalidateQueries({ queryKey: ['userPartners'] });
    } catch {
      toast.error('Failed to update email');
    } finally {
      setOrgEmailSaving(false);
    }
  };

  if (!activePartner) return null;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Settings</h1>

      {/* Organization name */}
      {isOwner && (
        <Card className="border border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="org-name" className="text-sm">Name</Label>
                <Input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setOrgNameDirty(e.target.value !== activePartner.partner.name);
                  }}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={handleSaveOrgName}
                disabled={!orgNameDirty || orgNameSaving}
              >
                {orgNameSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization email */}
      {isOwner && (
        <Card className="border border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notification email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Booking notifications, payment updates, and alerts are sent to this address.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="org-email" className="text-sm">Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={orgEmail}
                  onChange={(e) => {
                    setOrgEmail(e.target.value);
                    setOrgEmailDirty(e.target.value !== activePartner.partner.email);
                  }}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={handleSaveOrgEmail}
                disabled={!orgEmailDirty || orgEmailSaving}
              >
                {orgEmailSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only organization owners can manage members.
            </p>
          )}

          {isOwner && membersLoading && (
            <div className="py-4 flex justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {isOwner && membersError && (
            <div className="py-4 space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Failed to load members</p>
              <Button variant="outline" size="sm" onClick={() => refetchMembers()}>
                Try again
              </Button>
            </div>
          )}

          {isOwner && !membersLoading && !membersError && (
            <>
              {/* Member list */}
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.email}
                          {member.is_self && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                    {!member.is_self && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => handleRemoveMember(member.user_id, member.email)}
                        disabled={removingUserId === member.user_id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite section */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Invite link</p>
                  {!inviteToken && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleGenerateInvite}
                      disabled={inviteLoading}
                    >
                      <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                      {inviteLoading ? 'Generating...' : 'Generate link'}
                    </Button>
                  )}
                </div>

                {inviteUrl && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[rgba(242,241,238,0.6)] rounded-sm px-3 py-1.5 text-sm text-foreground font-mono truncate">
                      {inviteUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Anyone with this link can join {activePartner.partner.name}. The link expires in 30 days.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
