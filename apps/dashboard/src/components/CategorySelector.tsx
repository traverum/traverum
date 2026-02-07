import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPERIENCE_CATEGORIES } from '@traverum/shared';

interface CategorySelectorProps {
  value: string | null;
  onChange: (category: string | null) => void;
  disabled?: boolean;
}

export function CategorySelector({ value, onChange, disabled }: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Select 
        value={value || ''} 
        onValueChange={(val) => onChange(val || null)} 
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a category..." />
        </SelectTrigger>
        <SelectContent>
          {EXPERIENCE_CATEGORIES.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span>{category.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
