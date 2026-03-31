import { EXPERIENCE_TAGS } from '@traverum/shared';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagSelector({ value, onChange, disabled }: TagSelectorProps) {
  const toggle = (tagId: string) => {
    if (disabled) return;
    onChange(
      value.includes(tagId)
        ? value.filter(t => t !== tagId)
        : [...value, tagId]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {EXPERIENCE_TAGS.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-colors',
              selected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
            )}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
