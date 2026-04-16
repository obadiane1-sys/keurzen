# Dashboard Editorial Kawaii — Design Spec

## Context

Migration du design system de "Cafe Cosy" vers "Editorial Kawaii" (DESIGN_SYSTEM.md). Ce spec couvre le dashboard (web + mobile) et la sidebar web comme premier chantier. Les tokens V2 coexistent avec les anciens pour ne pas casser le reste de l'app.

## Decisions

- **Remplacement total** de Cafe Cosy par Editorial Kawaii, migration progressive
- **Tokens V2 en parallele** : `tokensV2.ts` (mobile) + CSS vars `--v2-*` (web)
- **Ghost borders autorisees** : `outline_variant` a 15% opacity sur les cards lifted
- **Full editorial asymetry** : overlaps, decalages, padding asymetrique
- **Direction visuelle** : Magazine Editorial (option A validee)
- **Insights** : carousel conserve, restyle surface-container + dots de couleur
- **Home Heart** : CTA flottant separe, pas en remplacement du score hero
- **Sidebar** : mise a jour dans ce chantier

---

## 1. Tokens V2

Nouveaux fichiers qui coexistent avec les anciens :
- **Mobile** : `apps/mobile/src/constants/tokensV2.ts`
- **Web** : nouvelles CSS variables prefixees `--v2-*` dans `globals.css`

### Couleurs

| Token | Valeur | Usage |
|---|---|---|
| primary | `#007261` | CTA, accents actifs, progress bars |
| primary_container | `#91eed9` | Fonds secondaires, soft glows |
| secondary | `#9d4b53` | Coral — alertes, labels, accents chauds |
| tertiary | `#cab4f3` | Soft glows decoratifs |
| tertiary_container | `#e8ddf5` | Home Heart fond |
| surface | `#fefcf4` | Canvas / fond global |
| surface_container | `#f5f4eb` | Cards inset, zones secondaires |
| surface_container_lowest | `#ffffff` | Cards actives, prioritaires (lifted) |
| surface_container_highest | `#e9e9de` | Etats pressed/inset |
| on_surface | `#383833` | Texte principal (Navy) |
| on_surface_variant | `#6b6b63` | Texte secondaire |
| outline_variant | `rgba(156,143,128,0.15)` | Ghost borders |

### Border Radius

| Token | Valeur | Usage |
|---|---|---|
| radius_md | `1.5rem` (24px) | Cards, containers |
| radius_xl | `3rem` (48px) | Boutons pill |

### Ombres

Aucune. Hierarchie par tonal layering uniquement.

### Typographie

- Famille : Nunito (inchange)
- Display : `-2% letter-spacing`
- Body : `line-height: 1.6`
- Minimum : 11px

---

## 2. Dashboard Layout — Magazine Editorial

Flow vertical organique avec asymetrie intentionnelle.

### Hierarchie des sections (top to bottom)

1. **Greeting** — coral overline "Bonjour", nom en Display bold, notification bell
2. **Insights Carousel** — scroll horizontal de cards surface-container
3. **Score Hero Card** — decale gauche, surface-lowest + ghost border, soft glow
4. **Grid asymetrique** — 1.1fr / 0.9fr, TaskEquity (inset) + MentalLoad (lifted, decale +8px)
5. **Upcoming Tasks** — decale droite, surface-lowest + ghost border
6. **Home Heart** — CTA flottant off-center droite, tertiary_container

### Principes de layout

- Cards alternent `surface-container` (inset) et `surface-lowest` (lifted)
- Jamais deux du meme type cote a cote
- Decalages gauche/droite alternes via margins negatifs (-10px / +8px)
- Padding asymetrique : 24px top, 32px bottom sur les cards lifted
- Soft glows : blobs primary_fixed et tertiary_fixed, blur(60px), opacity 0.10-0.12
- Ghost borders : 1px solid rgba(156,143,128,0.15) uniquement sur surface-lowest
- Overline labels : 11px uppercase, letter-spacing 2px, on_surface_variant
- Espacement entre sections : 2-3rem, pas de separateurs

---

## 3. Composants du Dashboard

### 3.1 Insights Carousel

- Fond cards : `surface-container` (#f5f4eb)
- Accent : dot colore 6px a gauche du label
  - secondary (coral) pour alert
  - primary (teal) pour conseil
  - tertiary (violet) pour wellbeing
- Texte : on_surface (message), on_surface_variant (label)
- Radius : 1.5rem, pas de bordure, pas d'ombre
- CTA : texte primary (#007261), pas de bouton

### 3.2 Score Hero Card

- Fond : surface-lowest (#fff) + ghost border
- Gauge circulaire : conic-gradient(primary, surface-container)
- Score : font-size 26px, weight 800, letter-spacing -1px
- Message coach : on_surface, line-height 1.6
- Soft glow : blob primary_fixed (#91eed9) en haut droite, opacity 0.12, blur 60px
- Decalage : margin-left -10px, margin-right 20px

### 3.3 Task Equity Card

- Fond : surface-container (inset)
- Donut chart : primary + secondary segments
- Label overline + pourcentages centres
- Padding asymetrique : 20px top, 28px bottom

### 3.4 Mental Load Card

- Fond : surface-lowest + ghost border
- Decale : margin-top 8px
- Niveau en Display bold
- Progress bar : primary sur fond surface-container
- Padding : 24px top, 24px bottom

### 3.5 Upcoming Tasks Card

- Fond : surface-lowest + ghost border
- Decale droite : margin-left 8px, margin-right -10px
- Icones categorie : carres surface-container, radius 12px
- Espacement 14px entre items, pas de separateurs
- Padding : 20px top, 28px bottom

### 3.6 Home Heart

- Fond : tertiary_container (#e8ddf5), radius 1.5rem
- Off-center droite : margin-left 40px
- CTA pill button : primary fond, on_primary texte, radius 3rem
- Texte : "Que voulez-vous faire ?" en on_surface_variant

---

## 4. Sidebar Web

### Structure

- Fond : surface-container (#f5f4eb)
- Pas de bordure droite — difference de fond suffit (no-line rule)
- Logo "Keurzen" : on_surface (#383833), dot accent primary (#007261)

### Navigation items

- Inactif : icone + label en on_surface_variant (#6b6b63)
- Actif : fond surface-lowest (#fff) + ghost border, texte primary (#007261)
- Hover : transition vers surface (#fefcf4)
- Radius items actifs : 1.5rem
- Pas d'ombre, pas de bordure coloree laterale

### Sections

- Separation par espacement vertical 2rem, pas de ligne
- Labels de section : overline 11px, uppercase, letter-spacing 1.5px, on_surface_variant

### User profile (bas)

- Avatar initiales : fond primary_container (#91eed9), texte primary
- Settings icon : on_surface_variant
- Logout : secondary (#9d4b53)

### Mode collapsed (lg breakpoint)

- Uniquement icones
- Item actif : fond surface-lowest circulaire
- Tooltip au hover avec le label

---

## 5. Fichiers impactes

### Nouveaux fichiers

- `apps/mobile/src/constants/tokensV2.ts`

### Fichiers modifies — Web

- `apps/web/src/app/globals.css` — ajout CSS vars V2
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/app/(app)/dashboard/page.tsx`
- `apps/web/src/components/dashboard/ScoreHeroCard.tsx`
- `apps/web/src/components/dashboard/TaskEquityCard.tsx`
- `apps/web/src/components/dashboard/MentalLoadCardV2.tsx`
- `apps/web/src/components/dashboard/UpcomingTasksCard.tsx`
- `apps/web/src/components/dashboard/InsightsCarousel.tsx`
- `apps/web/src/components/dashboard/InsightCard.tsx`
- `apps/web/src/components/ui/Card.tsx` (si utilise par le dashboard)

### Fichiers modifies — Mobile

- `apps/mobile/app/(app)/dashboard/index.tsx`
- `apps/mobile/src/components/dashboard/ScoreHeroCard.tsx`
- `apps/mobile/src/components/dashboard/TaskEquityCard.tsx`
- `apps/mobile/src/components/dashboard/MentalLoadCardV2.tsx`
- `apps/mobile/src/components/dashboard/UpcomingTasksCard.tsx`
- `apps/mobile/src/components/dashboard/InsightsCarousel.tsx`
- `apps/mobile/src/components/dashboard/InsightCard.tsx`

### Nouveaux composants (web + mobile)

- `HomeHeartCard.tsx` — CTA flottant organique

---

## 6. Ce qui n'est PAS dans le scope

- Migration des autres ecrans (tasks, calendar, settings, etc.)
- Mise a jour des tokens V1 existants
- Modification des composants partages dans packages/*
- Tab bar mobile
- Ecrans d'onboarding, auth, invitation
