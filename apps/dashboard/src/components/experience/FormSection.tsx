import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FormSectionProps {
  title: string;
  description?: string;
  stepNumber: number;
  isComplete?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  stepNumber,
  isComplete = false,
  isOpen = false,
  onOpenChange,
  children,
  className,
}: FormSectionProps) {
  const [internalOpen, setInternalOpen] = useState(isOpen);
  
  const open = onOpenChange ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isComplete
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  {description && !open && (
                    <CardDescription className="text-sm mt-0.5">
                      {description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {open ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {description && (
              <CardDescription className="mb-6">
                {description}
              </CardDescription>
            )}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Simple non-collapsible version for simpler use cases
interface SimpleSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SimpleSection({
  title,
  description,
  children,
  className,
}: SimpleSectionProps) {
  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
