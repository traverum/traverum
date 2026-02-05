import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

type BusinessType = 'supplier' | 'hotel' | 'hybrid';

interface BusinessTypeSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: BusinessType) => void;
}

export function BusinessTypeSelection({
  open,
  onOpenChange,
  onSelect,
}: BusinessTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<BusinessType | ''>('');

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            What type of business are you?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as BusinessType)}
          >
            <div className="flex items-start space-x-3 space-y-0 rounded-md border border-border p-4 hover:bg-accent/50 transition-ui">
              <RadioGroupItem value="supplier" id="supplier" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="supplier"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I create and sell experiences (Supplier)
                </Label>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Tour operators, activity providers, guides</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border border-border p-4 hover:bg-accent/50 transition-ui">
              <RadioGroupItem value="hotel" id="hotel" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="hotel"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I'm a hotel or accommodation (Hotel)
                </Label>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Hotels, resorts, B&Bs that want to sell experiences</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border border-border p-4 hover:bg-accent/50 transition-ui">
              <RadioGroupItem value="hybrid" id="hybrid" className="mt-1" />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="hybrid"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I do both (Hybrid)
                </Label>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Hotels that also create their own experiences</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="h-7 px-3"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
