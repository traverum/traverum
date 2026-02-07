import {
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useActivePartner } from '@/hooks/useActivePartner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function OrganizationDropdown() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const {
    activePartner,
    setActivePartnerId,
    userPartners,
    hasMultiplePartners,
    capabilities,
  } = useActivePartner();

  if (!activePartner) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Get capabilities for a specific partner (for non-active partners in list)
  const getPartnerCapabilities = (partnerId: string) => {
    // For active partner, use the already-loaded capabilities
    if (partnerId === activePartner.partner_id) {
      return capabilities;
    }
    // For other partners, we'd need to fetch - but for now use partner_type as fallback
    const partner = userPartners.find(up => up.partner_id === partnerId);
    if (!partner) return { isSupplier: false, isHotel: false };
    
    // Use partner_type as indicator (capabilities will be recalculated when switched to)
    const type = partner.partner.partner_type;
    return {
      isSupplier: type === 'supplier',
      isHotel: type === 'hotel',
    };
  };

  // Determine badge text based on capabilities
  const getBadgeText = (partnerId: string) => {
    const partnerCaps = getPartnerCapabilities(partnerId);
    if (partnerCaps.isSupplier && partnerCaps.isHotel) return 'Both';
    if (partnerCaps.isHotel) return 'Hotel';
    if (partnerCaps.isSupplier) return 'Experiences';
    return '';
  };

  const getActivePartnerBadge = () => {
    if (capabilities.isSupplier && capabilities.isHotel) return 'Both';
    if (capabilities.isHotel) return 'Hotel';
    if (capabilities.isSupplier) return 'Experiences';
    return '';
  };

  const activeBadge = getActivePartnerBadge();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-3 hover:bg-accent transition-ui"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground truncate">
                  {activePartner.partner.name}
                </span>
                {activeBadge && (
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {activeBadge}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* Organization Switcher */}
        {hasMultiplePartners && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              Organizations
            </DropdownMenuLabel>
            {userPartners.map((up) => {
              const isActive = up.partner_id === activePartner.partner_id;
              const badgeText = isActive ? activeBadge : getBadgeText(up.partner_id);
              
              const handleSwitch = () => {
                setActivePartnerId(up.partner_id);
                navigate('/dashboard', { replace: true });
              };
              
              return (
                <DropdownMenuItem
                  key={up.id}
                  onClick={handleSwitch}
                  className={cn(
                    'flex items-center justify-between cursor-pointer px-2 py-1.5',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={cn('truncate', isActive && 'font-medium')}>
                      {up.partner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {badgeText && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {badgeText}
                      </span>
                    )}
                    {isActive && <CheckIcon className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Type Switcher (for hybrid organizations) */}
        {capabilities.isSupplier && capabilities.isHotel && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              Views
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate('/supplier/dashboard')}
              className="cursor-pointer px-2 py-1.5"
            >
              Experiences
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/hotel/dashboard')}
              className="cursor-pointer px-2 py-1.5"
            >
              Hotels
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Logout */}
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
