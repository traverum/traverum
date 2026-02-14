// Common languages for tour experiences — mirrored from dashboard's LanguageSelector
const COMMON_LANGUAGES = [
  { code: 'en', name: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'es', name: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', name: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', name: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'it', name: 'Italian', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'pt', name: 'Portuguese', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'nl', name: 'Dutch', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'ru', name: 'Russian', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'zh', name: 'Chinese', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ja', name: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'ko', name: 'Korean', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'ar', name: 'Arabic', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'pl', name: 'Polish', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'tr', name: 'Turkish', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'cs', name: 'Czech', flag: '\u{1F1E8}\u{1F1FF}' },
  { code: 'el', name: 'Greek', flag: '\u{1F1EC}\u{1F1F7}' },
  { code: 'sv', name: 'Swedish', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'da', name: 'Danish', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'fi', name: 'Finnish', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'no', name: 'Norwegian', flag: '\u{1F1F3}\u{1F1F4}' },
] as const

export function getLanguageName(code: string): string {
  return COMMON_LANGUAGES.find(l => l.code === code)?.name || code.toUpperCase()
}

export function getLanguageFlag(code: string): string {
  return COMMON_LANGUAGES.find(l => l.code === code)?.flag || '\u{1F310}'
}

export { COMMON_LANGUAGES }
