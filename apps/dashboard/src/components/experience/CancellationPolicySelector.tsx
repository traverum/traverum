import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  CancellationPolicy,
  CANCELLATION_POLICIES,
} from '@/lib/availability';

interface CancellationPolicySelectorProps {
  policy: CancellationPolicy;
  onPolicyChange: (policy: CancellationPolicy) => void;
  disabled?: boolean;
}

export function CancellationPolicySelector({
  policy,
  onPolicyChange,
  disabled = false,
}: CancellationPolicySelectorProps) {
  return (
    <div className="space-y-6">
      {/* Guest Cancellation Policy */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Cancellation Policy</Label>

        <RadioGroup
          value={policy}
          onValueChange={(value) => onPolicyChange(value as CancellationPolicy)}
          disabled={disabled}
          className="space-y-3"
        >
          {CANCELLATION_POLICIES.map((option) => (
            <div
              key={option.value}
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer',
                policy === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => !disabled && onPolicyChange(option.value)}
            >
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={option.value}
                    className="font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  {option.recommended && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Full refund if you cancel due to weather or emergency.
        </p>
      </div>
    </div>
  );
}

// Default values export for form initialization
export const defaultCancellationPolicy = {
  policy: 'moderate' as CancellationPolicy,
};
