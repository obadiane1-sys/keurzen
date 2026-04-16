# Onboarding multi-etapes — Design Spec

**Date :** 2026-04-07
**Scope :** Flow d'onboarding initial post-signup, 4 etapes de personnalisation + ecran de completion.

---

## Objectif

Afficher un flow d'onboarding une seule fois apres la creation de compte, avant le dashboard. Les reponses alimentent le dashboard initial (widgets prioritaires) et peuvent pre-configurer la baseline NASA-TLX.

---

## Decisions prises

| Question | Decision |
|---|---|
| Stockage des reponses | Table Supabase `onboarding_preferences` (colonnes typees) |
| Declenchement du flow | Redirect dans `dashboard/index.tsx` si `!has_seen_onboarding` |
| Navigation entre etapes | Un seul ecran avec state local (`useState<number>`) |
| Fin du flow | Ecran recapitulatif avec mascotte avant redirect |
| Skip possible | Oui, bouton "Passer" discret sur chaque etape |

---

## Base de donnees

### Table `onboarding_preferences`

```sql
CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  household_type TEXT,       -- solo | couple | family | large_family
  current_split TEXT,        -- mainly_me | equal | varies | starting
  pain_point TEXT,           -- meals | chores | planning | finances
  main_goal TEXT,            -- mental_relief | overview | balance | save_time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON public.onboarding_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.onboarding_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.onboarding_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Etapes du flow

### Etape 1 — Composition du foyer

- **Titre :** "Comment est compose votre foyer ?"
- **Options (cards larges, selection unique) :**

| Emoji | Label | Valeur DB |
|---|---|---|
| person emoji | Je vis seul-e | `solo` |
| couple emoji | En couple | `couple` |
| family emoji | Famille avec enfants | `family` |
| large family emoji | Grande famille | `large_family` |

### Etape 2 — Repartition actuelle

- **Titre :** "Qui gere le foyer aujourd'hui ?"
- **Options :**

| Emoji | Label | Valeur DB |
|---|---|---|
| muscle emoji | Principalement moi | `mainly_me` |
| handshake emoji | On se partage equitablement | `equal` |
| cycle emoji | Ca varie beaucoup | `varies` |
| new emoji | On commence a s'organiser | `starting` |

### Etape 3 — Point de douleur principal

- **Titre :** "Qu'est-ce qui vous prend le plus d'energie ?"
- **Options :**

| Emoji | Label | Valeur DB |
|---|---|---|
| cart emoji | Les courses et repas | `meals` |
| broom emoji | Les taches menageres | `chores` |
| calendar emoji | L'organisation generale | `planning` |
| money emoji | Les finances du foyer | `finances` |

### Etape 4 — Objectif principal

- **Titre :** "Qu'attendez-vous de Keurzen ?"
- **Options :**

| Emoji | Label | Valeur DB |
|---|---|---|
| zen emoji | Me decharger l'esprit | `mental_relief` |
| eye emoji | Avoir une vue d'ensemble | `overview` |
| balance emoji | Mieux equilibrer avec mon partenaire | `balance` |
| lightning emoji | Gagner du temps au quotidien | `save_time` |

### Ecran de completion

- Mascotte expression `happy`, taille 120
- Titre : "Tout est pret !"
- Sous-titre : "Keurzen est configure pour vous. Decouvrez votre tableau de bord."
- CTA : "Decouvrir Keurzen" → save + redirect dashboard

---

## UX & Navigation

### Progress bar
- 4 segments horizontaux en haut de l'ecran
- Segment actif : `Colors.terracotta`
- Segment inactif : `Colors.borderLight`
- Hauteur : 4px, border-radius full

### Cards de selection
- `backgroundColor: Colors.backgroundCard`
- `borderRadius: BorderRadius.card` (16px)
- `Shadows.card`
- Bordure selectionnee : 2px `Colors.terracotta`
- Emoji en grand (32px) + texte en `Typography.fontSize.base`
- Espacement vertical : `Spacing.md` entre les cards
- Touch target >= 44px (hauteur min de la card)
- Padding interne : `Spacing.base` horizontal, `Spacing.md` vertical

### Bouton "Continuer"
- `Button` component, variant `primary`, size `lg`, fullWidth
- Disabled tant qu'aucune option n'est selectionnee
- Active : enregistre la selection dans le state local et passe a l'etape suivante

### Bouton "Passer"
- `TouchableOpacity` avec texte `Text variant="bodySmall" color="muted"`
- Au skip : `markOnboardingSeen(userId)` + `router.replace('/(app)/dashboard')`
- Pas de sauvegarde partielle des reponses

### Bouton retour
- Visible sur les etapes 2, 3 et 4
- Icone `Ionicons chevron-back` en haut a gauche
- Revient a l'etape precedente sans perdre les selections

### Animations
- Fade in/out entre les etapes (cohérent avec `onboarding/_layout.tsx` animation: 'fade')
- Utiliser `Animated` de React Native pour les transitions

---

## Logique de sauvegarde

A la completion (clic sur "Decouvrir Keurzen") :
1. Upsert dans `onboarding_preferences` avec les 4 reponses
2. Appel `markOnboardingSeen(userId)` pour passer `has_seen_onboarding = true`
3. Mise a jour du profile dans le store auth
4. `router.replace('/(app)/dashboard')`

Au skip :
1. `markOnboardingSeen(userId)`
2. Mise a jour du profile dans le store auth
3. `router.replace('/(app)/dashboard')`

---

## Types TypeScript

```typescript
export type HouseholdType = 'solo' | 'couple' | 'family' | 'large_family';
export type CurrentSplit = 'mainly_me' | 'equal' | 'varies' | 'starting';
export type PainPoint = 'meals' | 'chores' | 'planning' | 'finances';
export type MainGoal = 'mental_relief' | 'overview' | 'balance' | 'save_time';

export interface OnboardingPreferences {
  id: string;
  user_id: string;
  household_type: HouseholdType | null;
  current_split: CurrentSplit | null;
  pain_point: PainPoint | null;
  main_goal: MainGoal | null;
  created_at: string;
  updated_at: string;
}
```

---

## Fichiers impactes

### Mobile (apps/mobile)

| Fichier | Action |
|---|---|
| `supabase/migrations/20260407_create_onboarding_preferences.sql` | Nouveau — migration table |
| `src/types/index.ts` | Ajout types `OnboardingPreferences` et enums |
| `src/lib/queries/onboarding.ts` | Nouveau — mutation upsert TanStack Query |
| `app/(app)/onboarding/setup.tsx` | Nouveau — ecran principal du flow |
| `app/(app)/dashboard/index.tsx` | Ajout redirect si `!has_seen_onboarding` |

### Web (apps/web)

| Fichier | Action |
|---|---|
| `src/app/(app)/onboarding/setup/page.tsx` | Nouveau — ecran equivalent |
| `src/lib/queries/onboarding.ts` | Nouveau — mutation upsert |
| Dashboard page | Ajout redirect si `!has_seen_onboarding` |

---

## Risques

- **Redirect loop** : si `markOnboardingSeen` echoue, l'utilisateur est redirige en boucle. Mitigation : catch l'erreur et rediriger quand meme au dashboard.
- **Profile pas encore charge** : le dashboard doit attendre que le profile soit charge avant de tester `has_seen_onboarding`. Utiliser le loading state existant.
- **Conflit avec post-join** : le flow post-join (`post-join.tsx`) est different et cible les membres invites. Les deux flows ne doivent pas se declencher en meme temps. Le post-join est gere par le ui.store, pas par `has_seen_onboarding`.
