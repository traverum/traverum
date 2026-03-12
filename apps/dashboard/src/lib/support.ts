/**
 * Support page path and copy for error toasts and inline error blocks.
 * Use these to guide users to report issues with context so we can fix them quickly.
 */
export const SUPPORT_PATH = '/support';
export const SUPPORT_CTA = 'Contact support';
export const SUPPORT_DESCRIPTION =
  'If this keeps happening, tell us what you did so we can fix it.';

/** Options to pass to Sonner toast.error() for a consistent support CTA. */
export function getSupportToastOptionsSonner(): {
  description?: string;
  action: { label: string; onClick: () => void };
} {
  return {
    description: SUPPORT_DESCRIPTION,
    action: {
      label: SUPPORT_CTA,
      onClick: () => {
        window.location.href = SUPPORT_PATH;
      },
    },
  };
}
