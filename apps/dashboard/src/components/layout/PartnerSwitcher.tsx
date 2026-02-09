import { ChevronDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useActivePartner } from '@/hooks/useActivePartner';
import { cn } from '@/lib/utils';

interface PartnerSwitcherProps {
  className?: string;
}

export function PartnerSwitcher({ className }: PartnerSwitcherProps) {
  const {
    activePartner,
    setActivePartnerId,
    userPartners,
    hasMultiplePartners,
  } = useActivePartner();

  if (!activePartner) {
    return null;
  }

  // If only one partner, show simple display without dropdown
  if (!hasMultiplePartners) {
    return (
      <div className={cn('flex items-center gap-2 min-w-0', className)}>
        <span className="font-semibold text-foreground truncate">
          {activePartner.partner.name}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('flex items-center gap-2 h-auto py-1.5 px-3 w-full justify-between min-w-0', className)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-semibold truncate">{activePartner.partner.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {userPartners.map((up) => {
          const isActive = up.partner_id === activePartner.partner_id;
          
          return (
            <DropdownMenuItem
              key={up.id}
              onClick={() => setActivePartnerId(up.partner_id)}
              className={cn(
                'flex items-center justify-between cursor-pointer',
                isActive && 'bg-accent'
              )}
            >
              <span className={cn(isActive && 'font-medium')}>
                {up.partner.name}
              </span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground cursor-pointer"
          disabled
        >
          <Plus className="h-4 w-4" />
          <span>Add new business</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
