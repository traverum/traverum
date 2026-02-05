import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common languages for tour experiences in Europe with emoji flags
const COMMON_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
];

// Helper function to get language name from code
export function getLanguageName(code: string): string {
  return COMMON_LANGUAGES.find(l => l.code === code)?.name || code.toUpperCase();
}

// Helper function to get language flag from code
export function getLanguageFlag(code: string): string {
  return COMMON_LANGUAGES.find(l => l.code === code)?.flag || '🌐';
}

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  disabled?: boolean;
}

export function LanguageSelector({ selectedLanguages, onLanguagesChange, disabled }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggleLanguage = (code: string) => {
    if (disabled) return;
    
    if (selectedLanguages.includes(code)) {
      onLanguagesChange(selectedLanguages.filter(l => l !== code));
    } else {
      onLanguagesChange([...selectedLanguages, code]);
    }
  };

  const getSelectedDisplay = () => {
    if (selectedLanguages.length === 0) {
      return 'Select languages...';
    }
    if (selectedLanguages.length <= 3) {
      return selectedLanguages.map(code => getLanguageFlag(code)).join(' ');
    }
    return `${selectedLanguages.slice(0, 3).map(code => getLanguageFlag(code)).join(' ')} +${selectedLanguages.length - 3}`;
  };

  return (
    <div className="space-y-2">
      <Label>Available Languages</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8"
            disabled={disabled}
          >
            <span className="flex items-center gap-1.5">
              {selectedLanguages.length > 0 ? (
                <span className="text-base">{getSelectedDisplay()}</span>
              ) : (
                <span className="text-muted-foreground">Select languages...</span>
              )}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-2" align="start">
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {COMMON_LANGUAGES.map((language) => {
              const isSelected = selectedLanguages.includes(language.code);
              return (
                <div
                  key={language.code}
                  className={cn(
                    "flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !disabled && toggleLanguage(language.code)}
                >
                  <Checkbox
                    id={`lang-${language.code}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleLanguage(language.code)}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`lang-${language.code}`}
                    className="flex items-center gap-2 flex-1 cursor-pointer text-sm"
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span>{language.name}</span>
                  </label>
                </div>
              );
            })}
          </div>
          {selectedLanguages.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        Select the languages you can offer this experience in. Guests will see these options when booking.
      </p>
    </div>
  );
}
