# Tasks Page Premium Redesign — Spec

**Date:** 2026-04-07
**Status:** Approved
**Scope:** Mobile (`apps/mobile`) + Web (`apps/web`)

---

## Objectif

Transformer la page taches d'un ecran fonctionnel en une experience premium "Cafe Cosy" avec des cartes immersives teintees par categorie, un header hero contextuel, et des filtres enrichis.

## Decisions de design

| Decision | Choix |
|----------|-------|
| Style de carte | Immersive — fond teinte par categorie, plus haute, feeling "fiche" |
| Header | Hero contextuel avec prenom + resume adaptatif |
| Filtres | Pills horizontales avec icones + compteurs |
| Taches terminees | Cachees par defaut, visibles via filtre "Faites" |
| FAB | Rond classique en bas a droite, shadow amelioree |
| Approche | Carte Teintee (fond subtil colore par categorie) |

---

## 1. Header Hero

### Mobile

- Prenom extrait de `profile.full_name.split(' ')[0]`
- Message contextuel adaptatif :
  - 0 taches non-done → "Tout est fait, beau travail !"
  - X en retard → mentionne "X tache(s) en retard" en `Colors.rose`
  - X pour aujourd'hui → mentionne "X pour aujourd'hui" en `Colors.terracotta`
  - Sinon → "X tache(s) en cours"
- Indicateurs inline : petits dots colores + texte
- Typo : prenom en `fontSize['2xl']` bold, sous-titre en `fontSize.base` regular `Colors.textSecondary`
- Pas de fond card — integre au background, **fixe hors du scroll**
- Padding : `Spacing.xl` horizontal, `Spacing.lg` vertical

### Web

- Layout horizontal : greeting a gauche, bouton "Creer" a droite
- Meme logique contextuelle pour le message
- Remplace le `PageHeader` actuel

---

## 2. Filtres Pills Premium

### Mobile

4 pills en row, chaque pill `flex: 1` :

| Pill | Icone (Ionicons) | Compteur |
|------|-------------------|----------|
| Toutes | `list-outline` | total non-done (coherent avec le filtre qui cache les done) |
| A faire | `ellipse-outline` | count status=todo |
| Faites | `checkmark-circle-outline` | count status=done |
| En retard | `alert-circle-outline` | count overdue |

**Style pill inactive :**
- Fond : `Colors.backgroundCard`
- Bordure : 1px `Colors.border`
- Texte : `Colors.textSecondary`
- Compteur : `Colors.textMuted` (exception : "En retard" quand count > 0 → `Colors.rose`)

**Style pill active :**
- Fond : `Colors.terracotta`
- Bordure : `Colors.terracotta`
- Texte + compteur : `Colors.textInverse`

**Layout :**
- `flexDirection: 'row'`, `gap: Spacing.sm`
- Hauteur min : 48px (touch target)
- `BorderRadius.full` (pill shape)
- Icone : 14px au-dessus du label
- Label : `fontSize.xs` semibold
- Compteur : `fontSize.xs` regular, en dessous ou a cote du label
- **Fixe hors du scroll** (sous le header hero)

### Web

- Tabs underline (style actuel) mais avec compteurs ajoutes en suffixe : "A faire · 5"
- Meme logique de comptage
- Compteur "En retard" en `var(--color-rose)` quand > 0

---

## 3. TaskCard Immersive Teintee

### Mapping couleur par categorie

| Categorie | Couleur | Opacity |
|-----------|---------|---------|
| `cleaning` | `Colors.terracotta` | 6% |
| `cooking` | `Colors.sauge` | 6% |
| `shopping` | `Colors.miel` | 6% |
| `admin` | `Colors.prune` | 6% |
| `children` | `Colors.rose` | 6% |
| `pets` | `Colors.sauge` | 6% |
| `garden` | `Colors.sauge` | 6% |
| `repairs` | `Colors.miel` | 6% |
| `health` | `Colors.rose` | 6% |
| `finances` | `Colors.prune` | 6% |
| `other` | `Colors.terracotta` | 6% |

### Structure de la carte (mobile)

```
┌─────────────────────────────────────────┐
│  [fond teinte categorie 6%]             │
│                                          │
│  {icone 16px} {label categorie}          │  ← header categorie
│                                          │
│  ☐  Titre de la tache (semibold)        │  ← checkbox + titre
│                                          │
│  📅 08 Avr  ⏱ 45 min    [Haute]   [AV] │  ← meta row
└─────────────────────────────────────────┘
```

**Header categorie :**
- Icone categorie (16px, `Colors.textSecondary`) + label en `fontSize.xs` `Colors.textSecondary`
- Utilise le mapping existant `categoryLabels` de `TaskCard.tsx`

**Zone principale :**
- Checkbox a gauche : 24px, `Colors.sauge` quand done, `Colors.gray300` sinon
- Titre : `fontSize.base` semibold, `numberOfLines={1}` truncate
- Gap `Spacing.sm` entre checkbox et titre

**Meta row :**
- `flexDirection: 'row'`, `gap: Spacing.md`, `alignItems: 'center'`
- Date echeance : icone `calendar-outline` 12px + "DD MMM" — `Colors.rose` si overdue, `Colors.textMuted` sinon
- Duree estimee : icone `time-outline` 12px + "XX min" — `Colors.textMuted` (affiche seulement si non null)
- Badge priorite : chip arrondi, fond teinte priorite — **uniquement si high ou urgent**
  - high → fond `Colors.rose` 10%, texte `Colors.rose`
  - urgent → fond `Colors.rose` 15%, texte `Colors.rose`
- Avatar assigne : `size="xs"`, pousse a droite via `flex: 1` spacer (affiche seulement si assigne)

**Dimensions :**
- Padding : `Spacing.base` (16px)
- BorderRadius : `BorderRadius.card` (16px)
- Shadow : `Shadows.card`
- Gap entre cartes : `Spacing.md` (12px)

**Etats :**
- Done : opacity 0.5, titre barre — mais cache par defaut (filtre)
- Overdue : badge status dot conserve, date en rose

**Interactions :**
- Tap → navigation vers detail
- Long press → navigation vers detail (edit)
- Swipe right-to-left → action delete (conserve tel quel)

### Structure web (TaskRow)

- Meme fond teinte par categorie (via CSS `background-color` avec opacity)
- Layout horizontal adapte :
  - Checkbox | priority dot | titre | categorie chip | date | avatar | hover actions
- Hover actions conservees (edit, delete)

---

## 4. FAB

- Position : `absolute`, `bottom: Spacing['2xl']`, `right: Spacing.xl`
- Taille : 56x56px
- Fond : `Colors.terracotta`
- Icone : `add`, 28px, `Colors.textInverse`
- BorderRadius : `BorderRadius.fab` (16px)
- Shadow : `Shadows.lg` (ameliore depuis `Shadows.card`)
- ActiveOpacity : 0.85
- Accessibilite : label "Creer une tache", role button

---

## 5. Layout global

### Mobile

- SafeAreaView fond `Colors.background`
- Header Hero **fixe** (hors FlatList)
- Filtres Pills **fixes** (hors FlatList)
- FlatList scrollable en dessous
  - `contentContainerStyle` : paddingHorizontal `Spacing.xl`, paddingBottom 100, paddingTop `Spacing.sm`
  - `ItemSeparatorComponent` : height `Spacing.md`
  - `RefreshControl` : tintColor `Colors.terracotta`
- FAB en overlay
- EmptyState avec mascotte quand zero taches (conserve)
- CompletionRatingSheet et TaskCompletionToast conserves

### Web

- PageHeader remplace par header hero (greeting + bouton Creer)
- Tabs underline avec compteurs
- Barre de recherche conservee
- Split-view detail conserve
- TaskList avec TaskRows teintes
- Modal detail mobile (< lg) conservee
- CreateTaskModal conserve

### Filtre "Toutes" — comportement change

Le filtre "Toutes" affiche desormais **uniquement les taches non-done** (au lieu de toutes). Les taches terminees sont accessibles uniquement via le filtre "Faites". Ce changement s'applique aux deux plateformes.

---

## 6. Fichiers impactes

### Mobile

| Fichier | Modification |
|---------|-------------|
| `apps/mobile/app/(app)/tasks/index.tsx` | Header hero, layout fixe, filtre "all" = non-done |
| `apps/mobile/src/components/tasks/TaskCard.tsx` | Fond teinte, header categorie, meta row restructure, badge priorite conditionnel |
| `apps/mobile/src/components/tasks/TaskFilters.tsx` | Icones, compteurs, style premium |

### Web

| Fichier | Modification |
|---------|-------------|
| `apps/web/src/app/(app)/tasks/page.tsx` | Header hero, compteurs tabs, filtre "all" = non-done |
| `apps/web/src/components/tasks/TaskRow.tsx` | Fond teinte par categorie |
| `apps/web/src/components/tasks/TaskList.tsx` | Aucun changement structurel |

### Nouveau fichier partage

| Fichier | Contenu |
|---------|---------|
| `packages/shared/src/taskCategoryColors.ts` | Mapping categorie → couleur pour les deux plateformes (si shared package existe), sinon defini localement dans chaque plateforme |

---

## 7. Ce qui ne change PAS

- Logique metier (queries, mutations, stores)
- Navigation (routes, stack)
- CompletionRatingSheet / TaskCompletionToast
- Swipe-to-delete
- CreateTaskModal (web)
- TaskDetail (web)
- Types, schemas, migrations
