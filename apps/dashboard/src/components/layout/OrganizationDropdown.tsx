import {
  ChevronDownIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CheckIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
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

  const handleAddOrganization = () => {
    navigate('/onboarding/add-business');
  };

  // Determine badge text based on capabilities
  const getBadgeText = (partnerId: string) => {
    const partner = userPartners.find(up => up.partner_id === partnerId);
    if (!partner) return '';
    
    const type = partner.partner.partner_type;
    if (type === 'hotel') return 'Hotel';
    return '';
  };

  const getActivePartnerBadge = () => {
    if (capabilities.isSupplier && capabilities.isHotel) return 'Both';
    if (capabilities.isHotel) return 'Hotel';
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
              Switch organization
            </DropdownMenuLabel>
            {userPartners.map((up) => {
              const isActive = up.partner_id === activePartner.partner_id;
              const badgeText = isActive ? activeBadge : getBadgeText(up.partner_id);
              const Icon = up.partner.partner_type === 'hotel' ? BuildingOfficeIcon : BriefcaseIcon;
              
              return (
                <DropdownMenuItem
                  key={up.id}
                  onClick={() => setActivePartnerId(up.partner_id)}
                  className={cn(
                    'flex items-center justify-between cursor-pointer px-2 py-1.5',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className={cn('truncate', isActive && 'font-medium')}>
                      {up.partner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {badgeText && (
                      <span className="text-xs text-muted-foreground">
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
              Switch view
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate('/supplier/dashboard')}
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5"
            >
              <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
              <span>Experiences view</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/hotel/selection')}
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5"
            >
              <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
              <span>Hotel view</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Add Organization */}
        <DropdownMenuItem
          onClick={handleAddOrganization}
          className="flex items-center gap-2 cursor-pointer px-2 py-1.5"
        >
          <PlusIcon className="h-4 w-4 text-muted-foreground" />
          <span>Add organization</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive px-2 py-1.5"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
