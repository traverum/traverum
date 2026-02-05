import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Activity-based tags for typical Italian experiences
export const EXPERIENCE_TAGS = [
  'Wine Tasting',
  'Cooking Class',
  'Boat Tour',
  'Hiking',
  'Cycling',
  'Art & Museum',
  'Food Tour',
  'Historical Tour',
  'Truffle Hunting',
  'Olive Oil Tasting',
  'Vespa Tour',
  'Photography',
  'Wellness & Spa',
  'Water Sports',
  'Skiing',
  'Night Tour',
] as const;

export type ExperienceTag = typeof EXPERIENCE_TAGS[number];

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagSelector({ selectedTags, onTagsChange, disabled }: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (disabled) return;
    
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {EXPERIENCE_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Badge
              key={tag}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors select-none',
                isSelected 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'hover:bg-muted',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          );
        })}
      </div>
      {selectedTags.length === 0 && (
        <p className="text-xs text-muted-foreground">Select at least one category</p>
      )}
    </div>
  );
}
