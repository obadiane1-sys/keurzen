# Keurzen — Design System (Lavender palette)

**Single source of truth for UI decisions.** Load this when working on any component, screen styling, theme, or token change.

> 🎨 **Tokens in production.** Palette active depuis le launch: Lavender (primary `#967BB6`).
> Two parallel implementations kept in sync:
> - **Mobile** (`apps/mobile/src/constants/tokens.ts`) — TS object consumed via `import { Colors, Spacing, ... }`
> - **Web** (`apps/web/src/app/globals.css`) — Tailwind v4 `@theme` block + shadcn semantic tokens

---

## 1. Creative direction

**Soft, premium, calm Lavender.** Warm violet anchoring a household/wellbeing product — the opposite of clinical blue SaaS. The palette signals care, trust, and low-cognitive-load — aligned with Keurzen's mental-load reduction purpose.

- **Tone**: soft, reassuring, never shouty
- **Hierarchy**: driven by subtle lavender-tinted elevation, not heavy shadows
- **Mascot integration**: the kawaii house lives comfortably in this palette

---

## 2. Color tokens — Lavender palette

### Primary (Lavender family)
```
primary         #967BB6   ← CTA, active states, brand moments
primaryLight    #E5DBFF   ← filled containers, highlights
primarySurface  #F3F0FF   ← subtle primary-tinted surfaces
```

### Accents
```
accent          #F4C2C2   ← coral accent, alerts douces, error fills
joy             #FFF9C4   ← warm yellow, celebration/success moods
```

### Text
```
textPrimary    #5F5475                        ← primary text (deep lavender)
textSecondary  rgba(95, 84, 117, 0.8)         ← secondary text
textMuted      rgba(95, 84, 117, 0.6)         ← placeholders, captions
textInverse    #FFFFFF                         ← text on primary surfaces
```

### Background & surface
```
background           #FFFFFF   ← global canvas
backgroundCard       #F9F8FD   ← card fills at rest
backgroundCardEnd    #F3F0FF   ← gradient end / hover state
backgroundElevated   #FFFFFF   ← floating elements
backgroundSubtle     #F3F0FF   ← subtle section tinting
```

### Border
```
border        #DCD7E8   ← standard border
borderLight   #F3F0FF   ← barely-there separator
borderFocus   #967BB6   ← focus ring (primary)
```

### Feedback
```
success   #81C784   ← soft green
warning   #FFF9C4   ← yellow (= joy)
error     #F4C2C2   ← coral (= accent)
info      #967BB6   ← primary
```

### Member colors (household members palette — 8 entries, used cyclically)
```
#967BB6  #F4C2C2  #B39DDB  #80CBC4
#FFE082  #FFAB91  #A5D6A7  #CE93D8
```

### Gray scale (warm, lavender-tinted)
```
gray50   #F9F8FD      gray500  #7A7190
gray100  #F3F0FF      gray600  #5F5475
gray200  #DCD7E8      gray700  #483F5C
gray300  #C4BDD4      gray800  #312944
gray400  #9B93AC      gray900  #1E1730
```

### Overlays
```
overlay        rgba(95, 84, 117, 0.35)   ← modal backdrops
overlayLight   rgba(95, 84, 117, 0.08)   ← hover tints
```

---

## 3. Web-specific — shadcn semantic tokens

Shadcn components consume these semantic aliases (mapped in `globals.css :root`). **Do not rename them** — shadcn internals depend on them:

```
--background       #FFFFFF         --primary              #967BB6
--foreground       #5F5475         --primary-foreground   #FFFFFF
--card             #F9F8FD         --secondary            #E5DBFF
--card-foreground  #5F5475         --secondary-foreground #5F5475
--popover          #FFFFFF         --muted                #F3F0FF
--popover-fg       #5F5475         --muted-foreground     rgba(95,84,117,0.8)
                                    --accent               #F3F0FF
--border           #DCD7E8         --accent-foreground    #5F5475
--input            #DCD7E8         --destructive          #F4C2C2
--ring             #967BB6
```

### Chart colors (Recharts/victory-native via shadcn)
```
--chart-1  #967BB6   ← primary
--chart-2  #F4C2C2   ← coral
--chart-3  #FFF9C4   ← yellow
--chart-4  #B39DDB   ← light purple
--chart-5  #80CBC4   ← teal (mental load accent)
```

### Sidebar tokens
All sidebar tokens (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.) map to the main palette — see `globals.css` `:root` block.

### Tailwind v4 consumption
Colors are consumed directly via `@theme { }` — no `tailwind.config.js` needed. In JSX:

```tsx
<Button className="bg-primary text-primary-foreground">     // shadcn primitive
<div className="bg-primary-surface text-text-primary">       // custom Keurzen
<Card className="bg-card border-border shadow-md">
```

---

## 4. Typography

### Fonts
- **Body**: Nunito (regular · medium · semibold · bold · extrabold) — native on mobile, Open Sans fallback on web via `var(--font-body)`
- **Titles / editorial**: Fredoka One (onboarding, marketing surfaces, mascot moments only)

### Mobile scale (`tokens.ts` → `Typography.fontSize`)
```
xs 11 · sm 13 · base 15 · md 16 · lg 18 · xl 20 · 2xl 24 · 3xl 28 · 4xl 32 · 5xl 40
```

### Line heights
```
tight   1.2   ← headlines
normal  1.5   ← body
relaxed 1.75  ← hero copy
```

### Rules
- Titles use **Fredoka One** only in: onboarding screens, splash, empty states with mascot, marketing pages
- All other UI uses Nunito — Semibold (600) for titles, Regular (400) for body
- Never drop below 11pt (accessibility floor)
- `textPrimary` for main text, `textSecondary` for supporting, `textMuted` for placeholders

---

## 5. Elevation & shadows

**Shadows are lavender-tinted** (`shadowColor: '#967BB6'` on mobile, `rgba(150, 123, 182, *)` on web). This is a signature — don't replace with black shadows.

### Mobile (`Shadows` in `tokens.ts`)
```
sm    offset 0,1   opacity 0.08   radius 4   elevation 1
md    offset 0,3   opacity 0.10   radius 10  elevation 3
lg    offset 0,6   opacity 0.12   radius 20  elevation 6
card  offset 0,3   opacity 0.10   radius 10  elevation 2
```

### Web (`globals.css`)
```
--shadow-sm    0 1px 2px  rgba(150, 123, 182, 0.08)
--shadow-md    0 2px 8px  rgba(150, 123, 182, 0.10)
--shadow-lg    0 4px 16px rgba(150, 123, 182, 0.12)
--shadow-card  0 3px 10px rgba(150, 123, 182, 0.10)
```

---

## 6. Shape (border radius)

Shared between mobile and web:

| Token | Radius | Use |
|---|---|---|
| `sm` | 8px | small pills, chips, dense elements |
| `md` / `input` | 12px | standard inputs |
| `lg` | 16px | buttons (soft premium feel) |
| `xl` / `card` / `fab` | 24px | main cards, FAB, large surfaces |
| `2xl` | 32px | hero cards, dashboard tiles |
| `3xl` | 40px | bottom sheets, modals |
| `full` | 9999px | avatars, round icon buttons |

### Shadcn-specific (web)
Shadcn `--radius: 0.75rem` drives `--radius-sm/md/lg/xl/2xl/3xl/4xl` via `calc()`. Don't hardcode pixel values in shadcn components — let the multiplier flow.

### Rules
- Default card radius: `24px` (xl) — gives Keurzen its soft premium feel
- Button radius: `16px` (lg) — not pills, but more rounded than M3 corporate 8px
- FAB / avatar: `full`

---

## 7. Spacing (4px grid)

```
xs  4       lg   20       3xl  40
sm  8       xl   24       4xl  48
md  12      2xl  32       5xl  64
base 16
```

- Screen padding: `base` (16) on mobile
- Between sections: `2xl` (32) vertical
- Inside cards: `base` (16) for content, `md` (12) for dense lists
- Touch targets: always ≥ 44×44pt (`TouchTarget.min`)

---

## 8. Components

### Button — primary
- **Mobile**: `Colors.primary` bg, `Colors.textInverse` text, `BorderRadius.button` (16px), height 48pt, `Typography.fontSize.md`
- **Web (shadcn)**: `<Button>` default variant automatically uses `--primary` / `--primary-foreground` / `--radius-lg`

### Button — secondary / outline
- **Mobile**: transparent bg, `Colors.primary` border (1px) and text
- **Web (shadcn)**: `<Button variant="outline">` → `--border` and `--foreground`

### Button — ghost / text
- **Mobile**: transparent, `Colors.primary` text
- **Web (shadcn)**: `<Button variant="ghost">`

### Card
- **Mobile**: `Colors.backgroundCard` bg, `BorderRadius.card` (24), `Shadows.card`, padding `Spacing.base` (16) inside
- **Web (shadcn)**: `<Card>` uses `--card` + `--card-foreground` + `--border` + `--radius-lg`

### Input field
- **Mobile**: `Colors.inputFocusedBg` bg, `BorderRadius.input` (12), `Colors.border` 1px border, focus → `Colors.borderFocus`
- **Web (shadcn)**: `<Input>` uses `--input` and `--ring` focus

### FAB
- `Colors.primary` bg, `Colors.textInverse` icon, `BorderRadius.fab` (24), 56pt, `Shadows.md`
- Position: bottom-right, 16pt margin

### Chip / Badge
- `Colors.primaryLight` bg (default) or `Colors.accent` (alert), text `Colors.textPrimary`, `BorderRadius.full`

### TLX slider (custom, see `globals.css`)
- Range input with lavender track + circular 20px thumb
- Thumb shadow: `0 1px 4px rgba(150, 123, 182, 0.15)` — respects the lavender tint
- See `.tlx-slider` class in `globals.css`

### Priority slider (custom)
- 6px lavender light track, 20px lavender primary thumb
- See `.priority-slider` in `globals.css`

---

## 9. Mascot

Soft kawaii house, no arms, no legs, open eyes, calm premium expression.
Component: `apps/mobile/src/components/ui/Mascot.tsx`

### Animations (defined in `globals.css`)
- `breathing` — idle, gentle scale 1.00 ↔ 1.03
- `sway` — slow rotation -3° ↔ +3° (onboarding idle)
- `pop` — entrance, 0.85 → 1.05 → 1.00
- `shake` — error feedback, quick rotation burst

### Placement rules
- Mascot appears on: onboarding · empty states · invitation welcome · celebration moments
- **Not** on every screen — preserve emotional punch
- Mascot primary color integrates with `Colors.primary` lavender

---

## 10. Do / Don't

### Do
- Favor `Colors.primary` (#967BB6) for all active/CTA moments
- Use `backgroundCard` (#F9F8FD) for default card rest, `backgroundCardEnd` (#F3F0FF) for gradient end or hover
- Keep shadows lavender-tinted — it's a signature
- Use Fredoka One for emotional titles (onboarding, mascot moments), Nunito for everything else
- On web, prefer existing shadcn components (`Button`, `Card`, `Dialog`) before writing custom
- Generous whitespace. Density should feel calm, not compressed

### Don't
- Don't use pure black `#000000`. Use `textPrimary` (`#5F5475`)
- Don't use blue, teal, or cool corporate palettes — they don't match the soft Lavender identity
- Don't hardcode hex values in components. If a value is missing from tokens, add it to tokens first
- Don't break the parallel between `tokens.ts` (mobile) and `globals.css` (web) — any palette change must ship in both files in the same commit
- Don't change shadcn semantic token names (`--primary`, `--muted`, etc.) — shadcn depends on them
- Don't swap Fredoka One for another display font — it's part of the brand recognition

---

## 11. Dark mode

**Not shipped in v1.** Dark theme tokens are not defined. Current scope: light only.

When dark mode is added post-launch:
- Define a complete parallel set in `:root.dark { }` (web) and a `darkColors` export (mobile)
- Primary stays `#967BB6` or a nearby dark-mode variant — the lavender identity must persist
- Test every screen, not just a few

---

## 12. Migration notes

If you encounter references to obsolete palettes in code or docs, migrate them to Lavender:

| Obsolete hex | Replace with |
|---|---|
| `#C4846C` Terracotta | `#967BB6` (primary) |
| `#8BA888` Sauge | `#81C784` (success) |
| `#007261` Teal | `#967BB6` (primary) |
| `#1275e2` Vivid Blue | `#967BB6` (primary) |
| `#c55b00` Deep Orange | `#F4C2C2` (accent) — or keep orange only if specifically branded |
| Any other custom palette | Lavender equivalent — audit with design-system-guardian agent |

Grep to find leftovers:
```bash
grep -rn "C4846C\|8BA888\|007261\|1275e2\|D4A959\|5f78a3" apps/ packages/
```

---

## Quick reference

- **Primary**: `#967BB6`
- **Text on background**: `#5F5475`
- **Card background**: `#F9F8FD`
- **Border**: `#DCD7E8`
- **Shadow tint**: `rgba(150, 123, 182, *)`
- **Main radii**: 16px buttons · 24px cards · 12px inputs
- **Fonts**: Nunito body, Fredoka One editorial titles
