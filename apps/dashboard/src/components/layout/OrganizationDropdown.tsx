import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  PlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useAuth } from '@/hooks/useAuth';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

const MAX_VISIBLE_PARTNERS = 20;

export function OrganizationDropdown() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isSuperadmin } = useSuperadmin();
  const {
    activePartner,
    activePartnerId,
    setActivePartnerId,
    userPartners,
  } = useActivePartner();
  const [search, setSearch] = useState('');

  if (!activePartner) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSelectPartner = (partnerId: string) => {
    if (partnerId !== activePartnerId) {
      setActivePartnerId(partnerId);
    }
    navigate('/dashboard');
  };

  const filteredPartners = useMemo(() => {
    let list = userPartners;
    if (isSuperadmin && search) {
      const q = search.toLowerCase();
      list = list.filter(
        (up) =>
          up.partner.name.toLowerCase().includes(q) ||
          up.partner.email.toLowerCase().includes(q)
      );
    }
    return list.slice(0, MAX_VISIBLE_PARTNERS);
  }, [userPartners, search, isSuperadmin]);

  return (
    <DropdownMenu onOpenChange={() => setSearch('')}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-1.5 px-3 hover:bg-accent transition-ui"
        >
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div className="flex items-center gap-1.5 w-full">
              {isSuperadmin && (
                <Shield className="h-3 w-3 text-primary flex-shrink-0" />
              )}
              <span className="font-medium text-sm text-foreground truncate block text-left">
                {activePartner.partner.name}
              </span>
            </div>
            {isSuperadmin && (
              <span className="text-[11px] text-muted-foreground leading-tight">
                Superadmin
              </span>
            )}
          </div>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-y-auto">
        {isSuperadmin && (
          <>
            <div className="px-2 py-1.5">
              <Input
                placeholder="Search partners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {filteredPartners.map((up) => {
          const isActiveOrg = up.partner_id === activePartnerId;
          return (
            <DropdownMenuItem
              key={up.id}
              onClick={() => handleSelectPartner(up.partner_id)}
              className={cn(
                'cursor-pointer px-2 py-1.5',
                isActiveOrg && 'bg-accent font-medium'
              )}
            >
              <span className="text-sm truncate flex-1">{up.partner.name}</span>
            </DropdownMenuItem>
          );
        })}

        {isSuperadmin && filteredPartners.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No partners found.
          </div>
        )}

        {isSuperadmin && userPartners.length > MAX_VISIBLE_PARTNERS && !search && (
          <div className="px-3 py-1.5 text-xs text-muted-foreground">
            Showing {MAX_VISIBLE_PARTNERS} of {userPartners.length}. Use search to find more.
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate('/settings')}
          className="cursor-pointer px-2 py-1.5"
        >
          <span className="flex items-center gap-2 text-sm">
            <Cog6ToothIcon className="h-4 w-4 flex-shrink-0" />
            Settings
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate('/onboarding/add-business')}
          className="cursor-pointer px-2 py-1.5"
        >
          <span className="flex items-center gap-2 text-sm">
            <PlusIcon className="h-4 w-4 flex-shrink-0" />
            New Organization
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive px-2 py-1.5"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
