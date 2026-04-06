# Micro-objectifs hebdomadaires — Design Spec

**Date:** 2026-04-06
**Status:** Validated

---

## Summary

Chaque lundi matin, le foyer recoit un objectif unique genere automatiquement, base sur les metriques de la semaine precedente. L'objectif s'affiche sur le dashboard comme une barre de progression integree au HouseholdScoreCard — exactement comme un objectif de pas dans une app fitness.

## Decisions

| Question | Decision |
|---|---|
| Mode de generation | Hybride : regles deterministes + Edge Function persistee en base |
| Nombre d'objectifs | Un seul, le plus prioritaire |
| Hierarchie des metriques | Completion > Equilibre > TLX > Streak > Maintien |
| Placement UI | Integre au HouseholdScoreCard (section en bas de la carte) |
| Objectif atteint | Celebration simple (barre 100%, check, texte), pas de nouvel objectif |
| Notification | Push simple le lundi matin, pas de push a l'atteinte |

---

## 1. Modele de donnees

### Table `weekly_objectives`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | Default `gen_random_uuid()` |
| `household_id` | uuid FK → households | ON DELETE CASCADE |
| `week_start` | date | Lundi ISO de la semaine |
| `type` | text | `completion` / `balance` / `tlx` / `streak` / `maintenance` |
| `target_value` | numeric | La cible (ex: 75 pour 75%) |
| `baseline_value` | numeric | Valeur de la semaine precedente |
| `current_value` | numeric | Valeur actuelle, mise a jour au refresh |
| `achieved` | boolean DEFAULT false | `true` quand `current_value >= target_value` |
| `achieved_at` | timestamptz | Quand l'objectif a ete atteint |
| `label` | text NOT NULL | Texte affiche (ex: "Atteindre 75% de completion") |
| `created_at` | timestamptz DEFAULT now() | |

**Contraintes :**
- UNIQUE `(household_id, week_start)` — un seul objectif par foyer par semaine
- CHECK `type IN ('completion', 'balance', 'tlx', 'streak', 'maintenance')`

**RLS :**
- SELECT : membres du foyer (`auth.uid()` in household members)
- INSERT/UPDATE/DELETE : aucune policy client — ecriture uniquement via `service_role` (Edge Functions)

---

## 2. Logique de generation — Edge Function `generate-weekly-objective`

**Declenchement :** Cron chaque lundi a 07:00 UTC.

**Algorithme :**

1. Lister tous les households actifs
2. Pour chaque household, recuperer les `weekly_stats` de la semaine precedente
3. Calculer les metriques aggregees :
   - `completion` = taches done / total (%)
   - `max_imbalance` = max absolute `tasks_delta` parmi les membres
   - `avg_tlx` = moyenne des scores TLX de la semaine
   - `streak` = jours consecutifs avec au moins 1 tache completee
4. Appliquer la hierarchie (premiere condition remplie) :

| Priorite | Condition | Type | Target | Label |
|---|---|---|---|---|
| 1 | completion < 80% | `completion` | min(prev + 10, 90) | "Atteindre {target}% de completion" |
| 2 | max_imbalance > 0.25 (25%) | `balance` | 20 (%) | "Reduire le desequilibre sous 20%" |
| 3 | avg_tlx > 65 | `tlx` | 55 | "Passer la charge mentale sous 55" |
| 4 | streak < 3 | `streak` | 5 | "Atteindre 5 jours consecutifs d'activite" |
| 5 | (defaut) | `maintenance` | max(score - 5, 50) | "Maintenir le score au-dessus de {target}" |

5. INSERT dans `weekly_objectives` avec `baseline_value` = valeur actuelle de la metrique
6. Envoyer une push notification a chaque membre du foyer

**Idempotence :** INSERT ... ON CONFLICT (household_id, week_start) DO NOTHING. Si l'objectif existe deja, on ne fait rien.

---

## 3. Mise a jour de la progression — RPC `refresh_objective_progress`

**Appele par le client** au pull-to-refresh et au focus du dashboard. Pas de cron.

**Logique :**
1. Recuperer l'objectif de la semaine en cours pour le household de l'utilisateur
2. Recalculer `current_value` selon le `type` :
   - `completion` : taches done / total cette semaine (%)
   - `balance` : max absolute `tasks_delta` * 100 (stocke et affiche en %, objectif inverse : atteint quand current <= target)
   - `tlx` : moyenne TLX de la semaine
   - `streak` : jours consecutifs courants
   - `maintenance` : household score actuel
3. UPDATE `current_value`
4. Si `current_value >= target_value` et `achieved = false` :
   - SET `achieved = true`, `achieved_at = now()`
5. Pour `balance` et `tlx`, la logique est inversee : l'objectif est atteint quand `current_value <= target_value`

**Securite :** `SECURITY DEFINER`, `SET search_path = public`, utilise `auth.uid()` pour determiner le household.

---

## 4. Integration UI

### 4.1 Mobile — HouseholdScoreCard

**Fichier :** `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx`

Ajout d'une section en bas de la carte existante :
- Separateur fin (`borderTop`)
- Ligne : icone cible + label de l'objectif
- Barre de progression : `current_value / target_value`
- Couleur selon le type :
  - `completion` → `Colors.sauge`
  - `balance` → `Colors.miel`
  - `tlx` → `Colors.prune`
  - `streak` → `Colors.terracotta`
  - `maintenance` → `Colors.sauge`
- Texte : "{current}% / {target}%" (ou valeur brute selon le type)
- Sous la barre : "Sem. derniere : {baseline}%" a gauche, "Cible : {target}%" a droite

**Etat atteint (`achieved === true`) :**
- Barre remplie a 100%, couleur `Colors.sauge`
- Icone checkmark a la place de la cible
- Texte : "Objectif atteint !"
- Pas de nouvel objectif — reste affiche jusqu'au lundi suivant

**Etat vide (pas d'objectif cette semaine) :**
- Ne rien afficher — la section est masquee

### 4.2 Web — meme composant

**Fichier :** `apps/web/src/components/dashboard/HouseholdScoreCard.tsx` (ou equivalent)

Meme logique, meme placement, adapte au style web.

### 4.3 Hook `useWeeklyObjective`

**Fichier (mobile) :** `apps/mobile/src/lib/queries/objectives.ts`
**Fichier (web) :** `apps/web/src/lib/queries/objectives.ts`

```typescript
interface WeeklyObjective {
  id: string;
  household_id: string;
  week_start: string;
  type: 'completion' | 'balance' | 'tlx' | 'streak' | 'maintenance';
  target_value: number;
  baseline_value: number;
  current_value: number;
  achieved: boolean;
  achieved_at: string | null;
  label: string;
}

function useWeeklyObjective(): {
  objective: WeeklyObjective | null;
  isLoading: boolean;
  isAchieved: boolean;
  progress: number; // 0-100, clamped
}
```

- Query `weekly_objectives` pour `week_start = lundi ISO courant` et le household de l'utilisateur
- Au mount, appelle `refresh_objective_progress` pour mettre a jour `current_value`
- `progress` : pour `balance` et `tlx` (objectifs inversés), calcul adapte

---

## 5. Notification push

**Declenchement :** Fin de `generate-weekly-objective`, apres l'insert.

**Message :**
- Titre : "Objectif de la semaine"
- Body : le `label` de l'objectif
- Deep link : aucun (ouvre le dashboard par defaut)

**Destinataires :** Tous les membres du foyer ayant un push token.

**Pas de notification a l'atteinte** — celebration visuelle uniquement.

---

## 6. Fichiers impactes

| Fichier | Action |
|---|---|
| `supabase/migrations/YYYYMMDD_create_weekly_objectives.sql` | Nouveau — table + RLS + RPC |
| `supabase/functions/generate-weekly-objective/index.ts` | Nouveau — Edge Function cron |
| `apps/mobile/src/lib/queries/objectives.ts` | Nouveau — hook `useWeeklyObjective` |
| `apps/mobile/src/components/dashboard/HouseholdScoreCard.tsx` | Modifie — section objectif |
| `apps/web/src/lib/queries/objectives.ts` | Nouveau — hook `useWeeklyObjective` |
| `apps/web/src/components/dashboard/HouseholdScoreCard.tsx` | Modifie — section objectif (ou equivalent) |
| Edge Function push existante ou nouvelle | Envoi push lundi matin |

---

## 7. Hors scope

- Pas d'ecran dedie pour l'objectif
- Pas de deuxieme objectif quand le premier est atteint
- Pas de generation par LLM
- Pas de notification a l'atteinte
- Pas d'historique des objectifs (V2 eventuel)
- Pas de personnalisation manuelle des objectifs
