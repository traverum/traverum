declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.onload = () => {
      window.grecaptcha?.ready(() => resolve());
    };
    script.onerror = () => reject(new Error('reCAPTCHA script failed to load'));
    document.head.appendChild(script);
  });
}

/**
 * Get a reCAPTCHA v3 token for the given action (e.g. signup).
 * Loads the reCAPTCHA script if needed.
 */
export async function getRecaptchaToken(siteKey: string, action = 'signup'): Promise<string> {
  await loadRecaptchaScript(siteKey);
  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA not available');
  }
  return window.grecaptcha.execute(siteKey, { action });
}
