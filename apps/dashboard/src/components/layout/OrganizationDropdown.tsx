import { useLocation, useNavigate } from 'react-router-dom';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const VIEW_STORAGE_KEY = 'traverum_active_view';
type ViewMode = 'experiences' | 'stays';

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

  // Determine current view from route or localStorage
  const getCurrentView = (): ViewMode => {
    if (location.pathname.startsWith('/supplier')) return 'experiences';
    if (location.pathname.startsWith('/hotel') || location.pathname.startsWith('/stays')) return 'stays';
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'experiences' || stored === 'stays') return stored as ViewMode;
    } catch {}
    return 'experiences';
  };

  const currentView = getCurrentView();

  // Handle selecting a view for any organization (switches org + view in one action)
  const handleViewSelect = (partnerId: string, view: ViewMode) => {
    if (partnerId !== activePartnerId) {
      setActivePartnerId(partnerId);
    }
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {}
    if (view === 'stays') {
      navigate('/hotel/dashboard');
    } else {
      navigate('/supplier/dashboard');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-1.5 px-3 hover:bg-accent transition-ui"
        >
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="font-medium text-sm text-foreground truncate block w-full text-left">
              {activePartner.partner.name}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              {currentView === 'experiences' ? 'Experiences' : 'Stays'}
            </span>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Organization list with view submenus */}
        {userPartners.map((up) => {
          const isActiveOrg = up.partner_id === activePartnerId;
          return (
            <DropdownMenuSub key={up.id}>
              <DropdownMenuSubTrigger
                className={cn(
                  'cursor-pointer px-2 py-1.5',
                  isActiveOrg && 'bg-accent font-medium'
                )}
              >
                <span className="text-sm truncate flex-1">{up.partner.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => handleViewSelect(up.partner_id, 'experiences')}
                  className={cn(
                    'cursor-pointer px-3 py-1.5',
                    isActiveOrg && currentView === 'experiences' && 'bg-accent font-medium'
                  )}
                >
                  <span className="text-sm">Experiences</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleViewSelect(up.partner_id, 'stays')}
                  className={cn(
                    'cursor-pointer px-3 py-1.5',
                    isActiveOrg && currentView === 'stays' && 'bg-accent font-medium'
                  )}
                >
                  <span className="text-sm">Stays</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem
          onClick={() => navigate('/settings')}
          className="cursor-pointer px-2 py-1.5"
        >
          <span className="flex items-center gap-2 text-sm">
            <Cog6ToothIcon className="h-4 w-4 flex-shrink-0" />
            Settings
          </span>
        </DropdownMenuItem>

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
