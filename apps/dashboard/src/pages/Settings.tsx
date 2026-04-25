import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Copy, Trash2, Users, Link as LinkIcon, Check, Mail, Building2, Phone, UserCircle } from 'lucide-react';
import { getSupportToastOptionsSonner } from '@/lib/support';
import { AvatarUploader } from '@/components/AvatarUploader';

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

  // Organization phone (receptionist contact; optional)
  const [orgPhone, setOrgPhone] = useState('');
  const [orgPhoneSaving, setOrgPhoneSaving] = useState(false);
  const [orgPhoneDirty, setOrgPhoneDirty] = useState(false);

  // Host profile
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [partnerSlug, setPartnerSlug] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);

  useEffect(() => {
    if (activePartner?.partner?.name) {
      setOrgName(activePartner.partner.name);
      setOrgNameDirty(false);
    }
    if (activePartner?.partner?.email) {
      setOrgEmail(activePartner.partner.email);
      setOrgEmailDirty(false);
    }
    const phone = activePartner?.partner?.phone ?? '';
    setOrgPhone(phone);
    setOrgPhoneDirty(false);
  }, [activePartner?.partner?.name, activePartner?.partner?.email, activePartner?.partner?.phone]);

  // Load host profile fields from DB (these aren't in the useUserPartners select)
  const { data: profileData } = useQuery({
    queryKey: ['partnerProfile', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return null;
      const { data } = await supabase
        .from('partners')
        .select('display_name, bio, avatar_url, profile_visible, partner_slug, city, country')
        .eq('id', activePartnerId)
        .single();
      return data;
    },
    enabled: !!activePartnerId,
  });

  useEffect(() => {
    if (profileData) {
      setDisplayName(profileData.display_name ?? '');
      setBio(profileData.bio ?? '');
      setCity(profileData.city ?? '');
      setCountry(profileData.country ?? '');
      setAvatarUrl(profileData.avatar_url ?? null);
      setProfileVisible(profileData.profile_visible ?? false);
      setPartnerSlug(profileData.partner_slug ?? '');
      setProfileDirty(false);
    }
  }, [profileData]);

  const isOwner = activePartner?.role === 'owner';
  const canManageSettings = isOwner || activePartner?.role === 'superadmin';

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
    enabled: !!activePartnerId && !!session?.access_token && canManageSettings,
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
        toast.error(err.error || 'Failed to generate invite link', getSupportToastOptionsSonner());
        return;
      }

      const data = await res.json();
      setInviteToken(data.token);
    } catch {
      toast.error('Something went wrong', getSupportToastOptionsSonner());
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
        toast.error(err.error || 'Failed to remove member', getSupportToastOptionsSonner());
        return;
      }

      toast.success(`${email} has been removed`);
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['userPartners'] });
    } catch {
      toast.error('Something went wrong', getSupportToastOptionsSonner());
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
      toast.error('Failed to update name', getSupportToastOptionsSonner());
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
      toast.error('Failed to update email', getSupportToastOptionsSonner());
    } finally {
      setOrgEmailSaving(false);
    }
  };

  const handleSaveOrgPhone = async () => {
    if (!activePartnerId) return;
    const trimmed = orgPhone.trim();
    const digits = trimmed.replace(/\D/g, '');
    if (trimmed.length > 0 && digits.length < 6) {
      toast.error('Please enter a valid phone number, or leave the field empty');
      return;
    }

    setOrgPhoneSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ phone: trimmed.length > 0 ? trimmed : null })
        .eq('id', activePartnerId);

      if (error) throw error;

      toast.success(trimmed.length > 0 ? 'Phone number updated' : 'Phone number removed');
      setOrgPhoneDirty(false);
      queryClient.invalidateQueries({ queryKey: ['userPartners'] });
    } catch {
      toast.error('Failed to update phone number', getSupportToastOptionsSonner());
    } finally {
      setOrgPhoneSaving(false);
    }
  };

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (!partnerSlug || partnerSlug === slugify(displayName)) {
      setPartnerSlug(slugify(value));
    }
    setProfileDirty(true);
  };

  const handleSaveProfile = async () => {
    if (!activePartnerId) return;

    if (profileVisible && !displayName.trim()) {
      toast.error('Display name is required when profile is visible');
      return;
    }

    const slug = partnerSlug.trim() || slugify(displayName);
    if (profileVisible && !slug) {
      toast.error('A URL slug is required when profile is visible');
      return;
    }

    setProfileSaving(true);
    try {
      const { data: updatedRow, error } = await supabase
        .from('partners')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          avatar_url: avatarUrl,
          profile_visible: profileVisible,
          partner_slug: slug || null,
        })
        .eq('id', activePartnerId)
        .select('id')
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          toast.error('This URL slug is already taken. Please choose a different one.', getSupportToastOptionsSonner());
          return;
        }
        const hint =
          error.message?.includes('display_name') || error.message?.includes('partner_slug')
            ? ' If you just deployed this feature, run the migration `20260328120000_add_partner_profiles` on your Supabase project.'
            : '';
        toast.error(`${error.message || 'Could not save host profile'}${hint}`, getSupportToastOptionsSonner());
        console.error('Host profile update failed:', error);
        return;
      }

      if (!updatedRow) {
        toast.error(
          'Could not save: this profile was not updated. You may not have access to this organization, or the database is missing the host profile columns — apply migration 20260328120000_add_partner_profiles.',
          getSupportToastOptionsSonner()
        );
        return;
      }

      toast.success('Host profile updated');
      setProfileDirty(false);
      queryClient.invalidateQueries({ queryKey: ['partnerProfile', activePartnerId] });
    } catch (e) {
      console.error('Host profile update failed:', e);
      toast.error(
        e instanceof Error ? e.message : 'Failed to update profile',
        getSupportToastOptionsSonner()
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (!activePartner) return null;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Settings</h1>

      {/* Organization name */}
      {canManageSettings && (
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

      {/* Notifications & contact */}
      {canManageSettings && (
        <Card className="border border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notifications & contact
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
            <p className="text-xs text-muted-foreground pt-1">
              Phone (optional) can be shown to partner hotels' reception when they need to reach you about a booking (call or WhatsApp). Include country code (e.g. +39…).
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="org-phone" className="text-sm flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  Phone
                </Label>
                <Input
                  id="org-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+39 …"
                  value={orgPhone}
                  onChange={(e) => {
                    setOrgPhone(e.target.value);
                    const saved = activePartner.partner.phone ?? '';
                    setOrgPhoneDirty(e.target.value !== saved);
                  }}
                />
              </div>
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={handleSaveOrgPhone}
                disabled={!orgPhoneDirty || orgPhoneSaving}
              >
                {orgPhoneSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Host profile */}
      {canManageSettings && (
        <Card className="border border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Host profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Show a personal profile on the booking page so guests can see who's behind the experiences. This builds trust and makes the page more human.
            </p>

            <AvatarUploader
              partnerId={activePartnerId!}
              currentUrl={avatarUrl}
              onUploaded={(url) => { setAvatarUrl(url); setProfileDirty(true); }}
            />

            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-sm">Display name</Label>
              <Input
                id="display-name"
                type="text"
                placeholder="Marco"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">The name guests will see (e.g. your first name).</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="host-bio" className="text-sm">Bio</Label>
              <Textarea
                id="host-bio"
                placeholder="Born and raised on the shores of Lake Maggiore, I've been guiding wine tours for over 10 years..."
                value={bio}
                rows={3}
                onChange={(e) => { setBio(e.target.value); setProfileDirty(true); }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="host-city" className="text-sm">City</Label>
                <Input
                  id="host-city"
                  type="text"
                  placeholder="Stresa"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setProfileDirty(true); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="host-country" className="text-sm">Country</Label>
                <Input
                  id="host-country"
                  type="text"
                  placeholder="Italy"
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setProfileDirty(true); }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Shown under your name on the host page (e.g. "Stresa, Italy"). Optional.</p>

            <div className="space-y-1.5">
              <Label htmlFor="partner-slug" className="text-sm">URL slug</Label>
              <div className="flex items-center gap-0">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1.5 rounded-l-md border border-r-0 border-border">
                  /hosts/
                </span>
                <Input
                  id="partner-slug"
                  type="text"
                  className="rounded-l-none"
                  placeholder="marco"
                  value={partnerSlug}
                  onChange={(e) => { setPartnerSlug(slugify(e.target.value)); setProfileDirty(true); }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visible" className="text-sm">Visible to guests</Label>
                <p className="text-xs text-muted-foreground">Show your profile on the booking page.</p>
              </div>
              <Switch
                id="profile-visible"
                checked={profileVisible}
                onCheckedChange={(checked) => { setProfileVisible(checked); setProfileDirty(true); }}
              />
            </div>

            <Button
              variant="default"
              size="sm"
              className="h-8"
              onClick={handleSaveProfile}
              disabled={!profileDirty || profileSaving}
            >
              {profileSaving ? 'Saving...' : 'Save profile'}
            </Button>
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
          {!canManageSettings && (
            <p className="text-sm text-muted-foreground">
              Only organization owners can manage members.
            </p>
          )}

          {canManageSettings && membersLoading && (
            <div className="py-4 flex justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {canManageSettings && membersError && (
            <div className="py-4 space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Failed to load members</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchMembers()}>
                  Try again
                </Button>
                <Link to="/support" className="text-sm text-primary hover:underline font-medium">
                  Contact support
                </Link>
              </div>
            </div>
          )}

          {canManageSettings && !membersLoading && !membersError && (
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
