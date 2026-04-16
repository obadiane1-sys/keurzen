# Keurzen "Cafe Cosy" Design System Mapping

shadcn semantic tokens are remapped to the Keurzen palette in `globals.css`. When building components, use both shadcn utilities AND Keurzen-specific tokens as appropriate.

## Token Mapping

| shadcn token | Keurzen color | Hex | Usage |
|---|---|---|---|
| `bg-primary` | Terracotta | `#C07A62` | CTA, FAB, active links |
| `bg-secondary` | Sauge | `#82A47E` | Success, validation |
| `bg-accent` | Miel | `#CFA24F` | Warnings, highlights |
| `bg-destructive` | Rose | `#CF7B74` | Alerts, errors, overdue |
| `bg-background` | Cream | `#FDFBF8` | Page background |
| `bg-card` | Off-white | `#FFFDF9` | Card surfaces |
| `bg-muted` | Sand light | `#F3EDE6` | Disabled, subtle backgrounds |
| `text-foreground` | Brown deep | `#2D1F17` | Primary text |
| `text-muted-foreground` | Brown warm | `#6B5D50` | Secondary text |
| `border-border` | Sand | `#EBE5DD` | Default borders |

## Keurzen-only tokens (not in shadcn)

These tokens are defined in the `@theme` block and used directly with Tailwind:

- `text-prune` / `bg-prune` — `#9585A3` — Mental load, TLX
- `bg-background-card` — `#FFFFFF` — Alternative card bg
- `text-text-primary` / `text-text-secondary` / `text-text-muted` — Original Keurzen text scale
- `text-text-inverse` — `#FFFDF9` — Text on dark backgrounds
- `border-border-light` — `#F3EDE6` — Lighter border variant
- `shadow-card` — Warm brown card shadow

## Rules

1. **Use shadcn utilities for shadcn components.** `bg-primary`, `text-muted-foreground`, etc. These resolve to Keurzen colors via the CSS variable mapping.
2. **Use Keurzen tokens for custom components.** `bg-terracotta`, `text-prune`, `shadow-card`, etc.
3. **Never hardcode hex values.** Always use a token.
4. **No cold blues or pure grays.** All neutrals are warm brown-tinted.
5. **Flat UI only.** No gradients. Shadows use warm brown rgba, never `#000`.
6. **Border radius uses Keurzen tokens** (`rounded-md` = 12px, `rounded-lg` = 16px) not shadcn's calculated values.
