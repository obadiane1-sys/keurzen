# Weekly Review — Design Spec

**Date :** 2026-04-05
**Scope :** Backend (enrichissement table + nouvelle Edge Function) + Mobile (écran dédié)

---

## Objectif

Offrir aux membres du foyer un bilan hebdomadaire complet : métriques clés pré-calculées (tâches, temps, TLX, équilibre) + rapport IA, avec notification push le lundi matin et un écran dédié full-page avec historique.

---

## 1. Base de données — Enrichir `weekly_reports`

Nouvelles colonnes ajoutées à la table existante `weekly_reports` :

| Colonne | Type | Default | Description |
|---|---|---|---|
| `total_tasks_completed` | `integer` | `0` | Tâches terminées cette semaine dans le foyer |
| `total_minutes_logged` | `integer` | `0` | Minutes totales loguées par le foyer |
| `avg_tlx_score` | `numeric(5,2)` | `NULL` | Score TLX moyen du foyer (NULL si aucun TLX) |
| `balance_score` | `numeric(5,2)` | `NULL` | Score d'équilibre 0-100 (100 = équilibre parfait) |
| `member_metrics` | `jsonb` | `'[]'::jsonb` | Métriques par membre |

**Structure `member_metrics` :**

```json
[
  {
    "user_id": "uuid",
    "name": "Prénom",
    "tasks_count": 5,
    "minutes": 180,
    "tlx_score": 42,
    "tasks_share": 0.55
  }
]
```

**Calcul `balance_score` :**

```
balance_score = 100 - (moyenne des |tasks_delta| des weekly_stats * 100)
```

Borné entre 0 et 100. Plus les écarts à la part attendue sont faibles, plus le score est élevé.

**Migration :** Idempotente avec `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## 2. Edge Function — Enrichir `generate-weekly-report`

Modifier la fonction existante `supabase/functions/generate-weekly-report/index.ts` :

**Changements :**

1. Après la collecte de données (déjà dans `promptData`), calculer :
   - `total_tasks_completed` = `completedTasks.length`
   - `total_minutes_logged` = somme des `timeLogs[].minutes`
   - `avg_tlx_score` = moyenne des `tlxEntries[].score` (ou NULL si vide)
   - `balance_score` = `100 - mean(abs(weeklyStats[].tasks_delta) * 100)`, borné [0, 100]
   - `member_metrics` = tableau par membre avec tasks_count, minutes, tlx_score, tasks_share

2. Inclure ces champs dans l'upsert existant (ligne ~283).

**Pas de changement** au flux Claude API, au prompt, ou à la validation.

---

## 3. Edge Function — `send-weekly-review-push` (nouvelle)

**Déclencheur :** Cron lundi 8h00 (séparé de la génération à 6h05).

**Flux :**

1. Calculer `week_start` (lundi courant)
2. Récupérer tous les `weekly_reports` de la semaine courante avec `balance_score IS NOT NULL`
3. Pour chaque foyer :
   a. Récupérer les `push_tokens` des membres via `household_members` JOIN `push_tokens`
   b. Construire le message : titre "Bilan de la semaine", body avec balance_score
   c. Envoyer via Expo Push API (`https://exp.host/--/api/v2/push/send`)
   d. Payload data : `{ type: 'weekly_review', week_start, household_id }`
4. Retourner le nombre de notifications envoyées

**Auth :** Service role uniquement (cron). Header `x-cron-secret` pour validation.

**Pattern :** Suivre le pattern de `morning-digest` pour l'envoi push.

---

## 4. Écran Mobile — `weekly-review.tsx`

**Route :** `app/(app)/dashboard/weekly-review.tsx`

**Data fetching :**

Nouveaux hooks dans `src/lib/queries/reports.ts` :

- `useWeeklyReview(weekStart?: string)` — fetch un rapport spécifique ou le courant
- `useWeeklyReviewHistory(limit: number)` — fetch les N derniers rapports (id, week_start, balance_score, total_tasks_completed, generated_at)

**Structure de l'écran (ScrollView) :**

### 4.1 Header
- Titre "Bilan de la semaine"
- Sous-titre "Semaine du {date}" en format `fr-FR`
- Bouton retour vers dashboard

### 4.2 Score global + Mascot
- Cercle animé affichant `balance_score` sur 100
- Mascot avec expression adaptée :
  - `balance_score >= 75` → `happy`
  - `balance_score >= 50` → `calm`
  - `balance_score < 50` → `tired`
- Label textuel sous le score ("Excellent", "Correct", "A améliorer")

### 4.3 Métriques clés
- 3 cartes en row horizontale :
  - Tâches terminées (`total_tasks_completed`)
  - Temps investi (`total_minutes_logged`, formaté en heures)
  - Charge mentale (`avg_tlx_score` sur 100, ou "—" si NULL)

### 4.4 Répartition par membre
- Card avec barres de progression pour chaque membre (depuis `member_metrics`)
- Affichage : nom, nombre de tâches, part en %, barre colorée avec `memberColors`

### 4.5 Rapport IA
- Réutiliser le pattern du `WeeklyReportCard` existant :
  - Summary (texte libre)
  - Points d'attention (collapsible, icônes)
  - Insights (collapsible)
  - Orientations (collapsible)
- Sections ouvertes par défaut sur cet écran (contrairement au dashboard)

### 4.6 Historique
- Liste verticale des 8 dernières semaines
- Chaque item : date, mini badge balance_score, nombre de tâches
- TouchableOpacity pour naviguer vers le détail de cette semaine (recharge l'écran avec `weekStart` en param)

### 4.7 Bouton regénérer
- En bas, style discret, réutilise `useRegenerateReport()`

**États :**
- Loading : skeleton
- Erreur : message + retry
- Pas de rapport : mascot `calm` + bouton "Générer le bilan"
- Rapport sans métriques (anciennes semaines) : afficher le rapport IA seul, masquer les métriques

---

## 5. Types TypeScript

Enrichir `WeeklyReport` dans `src/types/index.ts` :

```typescript
export interface WeeklyReport {
  // ... existant ...
  total_tasks_completed: number;
  total_minutes_logged: number;
  avg_tlx_score: number | null;
  balance_score: number | null;
  member_metrics: MemberMetric[];
}

export interface MemberMetric {
  user_id: string;
  name: string;
  tasks_count: number;
  minutes: number;
  tlx_score: number | null;
  tasks_share: number;
}
```

---

## 6. Navigation

- Dashboard → toucher le `WeeklyReportCard` ou un bouton "Voir le bilan" → `/(app)/dashboard/weekly-review`
- Push notification → deep link vers `/(app)/dashboard/weekly-review`
- Historique item → recharge avec param `?week=YYYY-MM-DD`

---

## 7. Fichiers impactés

**Backend :**
- `supabase/migrations/XXXX_enrich_weekly_reports.sql`
- `supabase/functions/generate-weekly-report/index.ts`
- `supabase/functions/send-weekly-review-push/index.ts` (nouveau)

**Mobile :**
- `src/types/index.ts`
- `src/lib/queries/reports.ts`
- `app/(app)/dashboard/weekly-review.tsx` (nouveau)
- `src/components/dashboard/WeeklyReportCard.tsx` (ajouter navigation)

**Hors scope :** Web (à implémenter en second temps).

---

## 8. Risques

- **Colonnes NULL sur anciennes semaines** : les rapports déjà générés n'auront pas les métriques. L'écran doit gérer ce cas gracieusement.
- **balance_score si un seul membre** : delta = 0, score = 100 par défaut. Acceptable.
- **Push tokens manquants** : certains membres n'ont peut-être pas encore de token. La fonction skip silencieusement.
- **Expo Push rate limits** : peu probable pour un foyer (2-5 membres), mais batch les envois par foyer.
