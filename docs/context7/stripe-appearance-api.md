# Stripe Appearance API

Source: https://docs.stripe.com/elements/appearance-api

Customize the look and feel of Stripe Elements (Payment Element, etc.) to match the widget design.

## CRITICAL LIMITATION

The `colorPrimary`, `colorBackground`, `colorText`, `colorSuccess`, `colorDanger`, and `colorWarning` variables **do NOT support `rgba()` or CSS `var(--myVariable)` syntax**.

You must pass static hex values for color variables. Resolve CSS custom properties to their computed hex values before passing to the Appearance API.

```typescript
// WRONG — will not work
const appearance = {
  variables: {
    colorPrimary: 'var(--accent)',        // BROKEN
    colorBackground: 'rgba(255,255,255,0.9)', // BROKEN
  },
}

// CORRECT — use static hex values
const appearance = {
  variables: {
    colorPrimary: '#1a1a2e',
    colorBackground: '#ffffff',
  },
}
```

**Note:** The `var()` syntax IS supported inside `rules` (for referencing Stripe's own variables like `var(--colorPrimary)`), but NOT in the top-level `variables` object for color values.

## Setup

### Themes

Start with a prebuilt theme, then customize:

- `stripe` (default) — clean, light
- `night` — dark mode
- `flat` — minimal borders

### Variables

Set variables to broadly customize all components:

```typescript
const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1a1a2e',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: '"Inter", system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
}
```

### Commonly used variables

| Variable | Description |
|---|---|
| `fontFamily` | Font family used throughout |
| `fontSizeBase` | Root font size (min 16px on mobile for inputs) |
| `spacingUnit` | Base spacing — increase/decrease for density |
| `borderRadius` | Border radius for tabs, inputs, components |
| `colorPrimary` | Primary brand color (hex only) |
| `colorBackground` | Background of inputs, tabs (hex only) |
| `colorText` | Default text color (hex only) |
| `colorDanger` | Error/destructive color (hex only) |

### Less common but useful variables

| Variable | Description |
|---|---|
| `buttonBorderRadius` | Border radius for buttons (defaults to `borderRadius`) |
| `focusBoxShadow` | Box shadow for focused components |
| `fontWeightNormal` | Normal text weight |
| `fontWeightMedium` | Medium text weight |
| `colorTextSecondary` | Secondary text (unselected tabs, labels) |
| `colorTextPlaceholder` | Input placeholder text |

### Input and label styles

```typescript
const appearance = {
  theme: 'stripe',
  inputs: 'spaced',    // 'spaced' (default) or 'condensed'
  labels: 'floating',  // 'auto' (default), 'above', or 'floating'
  variables: { /* ... */ },
}
```

## Rules (fine-tuning individual components)

Rules let you target specific component classes with CSS-like selectors:

```typescript
const appearance = {
  theme: 'stripe',
  variables: { /* ... */ },
  rules: {
    '.Input': {
      border: '1px solid #e0e6eb',
      boxShadow: 'none',
    },
    '.Input:focus': {
      borderColor: 'var(--colorPrimary)',
      boxShadow: '0 0 0 2px var(--colorPrimary)',
    },
    '.Input--invalid': {
      borderColor: 'var(--colorDanger)',
    },
    '.Label': {
      fontWeight: '500',
    },
    '.Tab': {
      border: '1px solid #e0e6eb',
    },
    '.Tab--selected': {
      borderColor: 'var(--colorPrimary)',
    },
  },
}
```

### Valid selectors

- Class names: `.Tab`, `.Label`, `.Input`, `.Block`, `.CheckboxInput`, etc.
- States: `.Input--invalid`, `.Tab--selected`
- Pseudo-classes: `.Tab:hover`, `.Input:focus`
- Pseudo-elements: `.Input::placeholder`
- Combos: `.Tab:hover`, `.Tab--selected`

### Invalid selectors

- Private classes: `.p-SomePrivateClass` (only public class names)
- Descendant selectors: `.Tab .TabLabel` (not supported)
- Invalid state combinations: `.Tab--invalid` (Tab doesn't have invalid state)

### Common class names

| Class | Description |
|---|---|
| `.Tab` | Payment method tabs |
| `.TabLabel` | Text inside tabs |
| `.TabIcon` | Icons inside tabs |
| `.Label` | Input labels |
| `.Input` | Input fields |
| `.Block` | Content blocks |
| `.CheckboxInput` | Checkbox inputs |
| `.CheckboxLabel` | Checkbox labels |
| `.CodeInput` | Code/OTP inputs |
| `.Error` | Error messages |

## Usage with Elements provider (React)

```tsx
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#1a1a2e',
    colorBackground: '#ffffff',
    colorText: '#1a1a2e',
    fontFamily: '"Inter", system-ui, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e0e6eb',
    },
    '.Input:focus': {
      borderColor: '#1a1a2e',
      boxShadow: '0 0 0 1px #1a1a2e',
    },
  },
}

function App() {
  return (
    <Elements
      stripe={stripePromise}
      options={{ mode: 'setup', currency: 'eur', appearance }}
    >
      <CheckoutForm />
    </Elements>
  )
}
```
