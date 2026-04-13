# Refonte page "Ajout de tâche" — Palette Lavande

**Date :** 2026-04-13
**Source de vérité :** Design Stitch (HTML fourni par l'utilisateur)

---

## 1. Palette lavande (tokens globaux)

Remplacement complet de la palette "Dreamy" par la palette lavande sur les deux plateformes.

| Token | Valeur | Usage |
|---|---|---|
| primary | `#967BB6` | CTA, accents actifs, icônes, liens |
| primaryLight | `#E5DBFF` | Fonds sélectionnés, pills actives |
| primarySurface | `#F3F0FF` | Fonds inputs, toggles inactifs, hover |
| textPrimary | `#5F5475` | Texte principal |
| textSecondary | `#5F5475` @ 80% | Texte secondaire |
| textMuted | `#5F5475` @ 60% | Placeholders |
| background | `#FFFFFF` | Fond global |
| backgroundCard | `#F9F8FD` | Fond surface/cartes |
| border | `#DCD7E8` | Bordures |
| success | `#81C784` | Inchangé |
| warning | `#FFF9C4` | Inchangé |
| error | `#F4C2C2` | Inchangé |

Shadows : teinte `#967BB6` au lieu de `#90CAF9`.

## 2. Structure du formulaire

### Mobile : écran `create.tsx`
### Web : modal `CreateTaskModal.tsx`

Champs dans l'ordre exact du design Stitch :

### 2.1 Toggle type de tâche
- Segmented control : "Ménage" (emoji maison) / "Perso" (emoji personne)
- Fond `primarySurface`, actif = blanc + shadow-sm, inactif = transparent
- Texte actif = `primary` + semibold, inactif = `textMuted`

### 2.2 Nom
- Label : uppercase, tracking-wider, couleur `primary` @ 70%, taille xs
- Input : fond `primarySurface` @ 30%, border `border`, rounded-xl, padding 14-16px
- Placeholder : "Ex : Courses, Ménage salon..."

### 2.3 Catégorie
- Même style label
- Dropdown/select avec emoji + nom de catégorie
- Chevron `expand_more` à droite, couleur `primary`
- Catégories existantes : cleaning, cooking, shopping, admin, children, pets, garden, repairs, health, finances, other

### 2.4 Assigné à
- Pills horizontales pour chaque membre du foyer
- Chaque pill : avatar rond (initiale) + prénom
- Sélectionné : fond `primaryLight`, texte `textPrimary`, semibold
- Non sélectionné : border `border`, texte `textMuted`
- Multi-sélection possible (comme aujourd'hui : un seul assigné)

### 2.5 Échéance
- Champ splitté en deux zones dans un seul conteneur rounded-xl :
  - Gauche : icône calendrier + date formatée (ex: "Samedi 14 juin"), séparé par border-r
  - Droite : icône horloge + heure (ex: "10:00")
- Mobile : ouvre les date/time pickers natifs au tap
- Web : inputs date/time natifs ou date picker

### 2.6 Priorité
- Slider custom 3 niveaux (0=Basse, 1=Moyenne, 2=Haute)
- Track : fond `primaryLight`, thumb : fond `primary` + border blanc + shadow
- Labels dessous : Basse / Moyenne (couleur `primary`) / Haute
- Valeur par défaut : Moyenne (1)

### 2.7 Répéter (récurrence)
- Dropdown avec options : Jamais, Quotidien, Hebdomadaire, Mensuel, Annuel, Personnaliser
- Option sélectionnée marquée d'un check
- **Personnaliser** ouvre un panneau inline avec :
  - Intervalle : boutons +/- avec label "N semaine(s)"
  - Jours de la semaine : 7 toggles ronds (L M M J V S D)
  - Heure : affichage de l'heure sélectionnée

### 2.8 Bouton "Créer la tâche"
- Fixé en bas de l'écran
- Full-width, fond `primary`, texte blanc, bold, rounded-xl
- Shadow `primary` @ 20%
- Gradient transparent vers blanc au-dessus du bouton

## 3. Champs supprimés du formulaire

Ces champs existaient dans le formulaire actuel mais sont absents du design Stitch :
- Description
- Zone (pièce)
- Temps estimé (estimated_minutes)
- Suggestions automatiques de tâches (TaskSuggestions)

Les champs restent dans le type `TaskFormValues` et la table DB. Ils reçoivent des valeurs par défaut à la soumission (description: null, zone: null, estimated_minutes: null).

## 4. Fichiers impactés

| Fichier | Action |
|---|---|
| `apps/mobile/src/constants/tokens.ts` | Remplacer palette Dreamy par Lavande |
| `apps/web/src/app/globals.css` | Remplacer variables CSS par Lavande |
| `apps/mobile/app/(app)/tasks/create.tsx` | Refonte complète du formulaire |
| `apps/web/src/components/tasks/CreateTaskModal.tsx` | Refonte complète du formulaire |

## 5. Ce qui ne change PAS

- Hooks et services (`useCreateTask`, `task.service.ts`)
- Types partagés (`TaskFormValues`, `Task`)
- Navigation (mobile: écran create, web: modal depuis page tasks)
- Logique de soumission
- Autres écrans de l'app (ils hériteront des nouveaux tokens automatiquement)

## 6. Mapping récurrence Stitch → types existants

| Option Stitch | Valeur `RecurrenceType` |
|---|---|
| Jamais | `none` |
| Quotidien | `daily` |
| Hebdomadaire | `weekly` |
| Mensuel | `monthly` |
| Annuel | — nouveau type à ajouter ou mapper |
| Personnaliser | Nécessite extension du modèle récurrence |

Note : le type `RecurrenceType` actuel est `none | daily | weekly | biweekly | monthly`. "Annuel" et "Personnaliser" (intervalle + jours) nécessitent une extension. Pour le MVP de cette refonte, on affiche les options mais on ne supporte que les valeurs existantes. Les options non supportées seront désactivées ou masquées.
