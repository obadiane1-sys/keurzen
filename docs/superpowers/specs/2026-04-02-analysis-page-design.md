# Page Analyse - Spec

## Objectif

Ecran d'analyse hebdomadaire accessible depuis le Menu hub (`/(app)/menu/analysis`). Vue resume avec KPIs, repartition membres, tendance TLX 12 semaines, rapport IA et taches contraignantes. Zero backend a creer — 100% hooks existants.

## Structure (top -> bottom)

### 1. Header
- Titre "Analyse" (h2 bold navy)
- Sous-titre "Semaine du {lundi} au {dimanche}" en textMuted 14px

### 2. KPIs (4 pills, row scrollable horizontal)
Chaque pill : bg backgroundCard, border 1.5px, radius 16, padding 12px 16px

| KPI | Hook | Affichage |
|---|---|---|
| Equilibre | `useWeeklyBalance()` | Dot colore + "Equilibre"/"Ecart"/"Desequilibre" |
| Taches | `useTasks()` | "{done}/{total} faites" |
| Temps | `useWeeklyBalance()` | "{totalMinutes}h" |
| TLX | `useTlxDelta()` | Score + fleche delta |

### 3. Repartition membres (card)
- bg backgroundCard, border 1.5px, radius 20, padding 22px
- Titre "Repartition" 18px bold
- Pour chaque membre : avatar 36px + nom 16px + heures 18px bold + pourcentage 14px muted
- Barre de progression 10px radius 10, bg couleur 22%, fill couleur
- Source : `useWeeklyBalance()`

### 4. Tendance TLX (card, sparkline maison)
- bg backgroundCard, border 1.5px, radius 20, padding 22px
- Titre "Charge mentale" 18px + icone Brain lavender
- Sous-titre "12 dernieres semaines"
- Sparkline : row de barres verticales (View), hauteur proportionnelle au score
- Couleur : mint si <= 33, #FFD166 si <= 66, coral sinon
- Label semaine en bas (S1, S2...) en 10px muted
- Source : `useTlxHistory(12)`

### 5. WeeklyReportCard (composant existant)
- Import depuis `src/components/dashboard/WeeklyReportCard.tsx`
- Aucune modification du composant

### 6. Taches contraignantes (card)
- bg backgroundCard, border 1.5px, radius 20, padding 22px
- Titre "Taches les plus lourdes" 18px
- Top 5 taches triees par estimated_minutes desc (parmi done + in_progress)
- Chaque row : dot priorite + titre 16px + "{n} min" en muted + avatar assigne
- Source : `useTasks()`

## Animations
- Staggered fade-in (meme pattern que dashboard/menu)
- Barres sparkline : animated height via Animated.timing, 600ms

## Fichiers a creer

| Fichier | Role |
|---|---|
| `app/(app)/menu/analysis.tsx` | Ecran principal |
| `src/components/analysis/KPIPills.tsx` | Barre de pills KPI scrollable |
| `src/components/analysis/MemberBreakdown.tsx` | Repartition membres avec barres |
| `src/components/analysis/TlxSparkline.tsx` | Mini graphe barres TLX 12 semaines |
| `src/components/analysis/TopTasks.tsx` | Top 5 taches chronophages |

## Contraintes
- Pas de nouvelle dependance
- Pas de victory-native pour le graphe (barres View simples)
- Tokens uniquement (Colors, Spacing, BorderRadius)
- Flat design, pas de shadows
- Mobile + web
