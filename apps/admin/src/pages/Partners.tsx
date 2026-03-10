import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { ExternalLink, Search, Building2 } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  email: string;
  partner_type: string;
  city: string | null;
  country: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  created_at: string | null;
}

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.traverum.com';

function usePartners() {
  return useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, email, partner_type, city, country, stripe_account_id, stripe_onboarding_complete, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Partner[];
    },
  });
}

export default function Partners() {
  const { data: partners = [], isLoading } = usePartners();
  const [search, setSearch] = useState('');

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    );
  });

  const openInDashboard = (partnerId: string) => {
    window.open(`${DASHBOARD_URL}/dashboard?partner=${partnerId}`, '_blank');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All supplier and hotel organizations. Open any partner in the dashboard to act on their behalf.
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'No partners match your search.' : 'No partners yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {partner.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={partner.partner_type === 'hotel' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {partner.partner_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[partner.city, partner.country].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      {partner.stripe_onboarding_complete ? (
                        <Badge variant="default" className="text-xs bg-success">Active</Badge>
                      ) : partner.stripe_account_id ? (
                        <Badge variant="secondary" className="text-xs">Incomplete</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInDashboard(partner.id)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'partner' : 'partners'}
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}
