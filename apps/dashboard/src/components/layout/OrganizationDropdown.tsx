import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const VIEW_STORAGE_KEY = 'traverum_active_view';

export function OrganizationDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const {
    activePartner,
    activePartnerId,
    setActivePartnerId,
    userPartners,
  } = useActivePartner();

  if (!activePartner) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Determine current view to preserve it when switching orgs
  const getCurrentView = (): string => {
    if (location.pathname.startsWith('/supplier')) return 'experiences';
    if (location.pathname.startsWith('/hotel') || location.pathname.startsWith('/stays')) return 'stays';
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'experiences' || stored === 'stays') return stored;
    } catch {}
    return 'experiences';
  };

  const handleOrganizationSwitch = (partnerId: string) => {
    if (partnerId !== activePartnerId) {
      setActivePartnerId(partnerId);
      // Stay in current view when switching org
      const view = getCurrentView();
      if (view === 'stays') {
        navigate('/hotel/dashboard');
      } else {
        navigate('/supplier/dashboard');
      }
    }
  };

  const hasMultipleOrgs = userPartners.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-3 hover:bg-accent transition-ui"
        >
          <span className="font-medium text-sm text-foreground truncate block flex-1 text-left">
            {activePartner.partner.name}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Organization list */}
        {userPartners.map((up) => {
          const isActiveOrg = up.partner_id === activePartnerId;
          return (
            <DropdownMenuItem
              key={up.id}
              onClick={() => handleOrganizationSwitch(up.partner_id)}
              className={cn(
                'cursor-pointer px-2 py-1.5 flex items-center justify-between',
                isActiveOrg && 'bg-accent'
              )}
            >
              <span className="text-sm truncate">{up.partner.name}</span>
              {isActiveOrg && (
                <CheckIcon className="h-3.5 w-3.5 text-primary flex-shrink-0 ml-2" />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* New Organization */}
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

        {/* Sign out */}
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
