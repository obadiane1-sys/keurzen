# Spec — Planification des repas + Liste de courses intelligente

**Date :** 2026-04-04
**Statut :** Draft
**Module :** meals

---

## Objectif

Ajouter un module complet de planification des repas dans Keurzen : catalogue de recettes (base pre-remplie + recettes du foyer), planning hebdomadaire flexible avec assignation du cuisinier, et generation automatique de la liste de courses avec fusion intelligente des ingredients. La cuisine est traitee comme une tache household integree au systeme TLX/equilibre existant.

---

## Decisions de design

| Decision | Choix |
|---|---|
| Source des recettes | Dataset statique (~300 recettes FR) + recettes perso du foyer |
| Planning | Flexible (pas de grille fixe, on ajoute aux jours voulus) |
| Repas types | `breakfast`, `lunch`, `dinner`, `snack` |
| Generation liste courses | Incrementale (au fil de l'eau) + regeneration complete sur periode |
| Integration TLX | Cuisiner = tache household avec rating de charge mentale |
| Collaboration | Tous les membres planifient, chaque repas assigne a un cuisinier |
| Navigation | Accessible depuis le Menu (pas d'onglet tab bar dedie) |
| Lien budget | Aucun en V1 |
| IA | Pas en V1, possible V2 |

---

## Modele de donnees

### Table `ingredients`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text, UNIQUE | Nom canonique ("tomate", "poulet") |
| `category` | text | Reutilise `ShoppingItemCategory` (fruits_legumes, viandes_poissons, etc.) |
| `default_unit` | text | g, ml, piece, botte, etc. |
| `created_at` | timestamptz | |

### Table `recipes`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid, PK | |
| `household_id` | uuid, nullable, FK | null = recette systeme, uuid = recette du foyer |
| `title` | text | |
| `description` | text, nullable | |
| `image_url` | text, nullable | |
| `prep_time` | int | Minutes de preparation |
| `cook_time` | int | Minutes de cuisson |
| `servings` | int | Nombre de portions par defaut |
| `difficulty` | text | 'easy', 'medium', 'hard' |
| `tags` | text[] | ['rapide', 'vegetarien', 'familial', ...] |
| `steps` | jsonb | [{order: 1, text: "..."}] |
| `source` | text | 'system' ou 'user' |
| `created_by` | uuid, nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Table `recipe_ingredients`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid, PK | |
| `recipe_id` | uuid, FK recipes | |
| `ingredient_id` | uuid, FK ingredients | |
| `quantity` | numeric | 200, 0.5, 2 |
| `unit` | text | g, ml, piece, cs, cc |
| `optional` | boolean, default false | Basiques (sel, poivre) = true |
| `note` | text, nullable | "emince", "en des", "concassees" |

### Table `meal_plan_items`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid, PK | |
| `household_id` | uuid, FK | |
| `recipe_id` | uuid, FK recipes | |
| `date` | date | |
| `meal_type` | text | 'breakfast', 'lunch', 'dinner', 'snack' |
| `servings` | int | Override du nombre de portions |
| `assigned_to` | uuid, nullable | Le cuisinier |
| `task_id` | uuid, nullable, FK tasks | Tache household generee |
| `created_by` | uuid | |
| `created_at` | timestamptz | |

### Table `recipe_favorites`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK | |
| `recipe_id` | uuid, FK | |
| `created_at` | timestamptz | |
| | UNIQUE(user_id, recipe_id) | |

### Pas de table `meal_plans`

Le planning est implicite : query par `household_id` + plage de dates sur `meal_plan_items`. Coherent avec l'approche flexible.

---

## RLS (Row Level Security)

| Table | Lecture | Ecriture |
|---|---|---|
| `ingredients` | Tous | Aucun (seed uniquement) |
| `recipes` | Tous pour `source = 'system'` ; membres du foyer pour `household_id` | Membres du foyer (recettes perso uniquement) |
| `recipe_ingredients` | Suit la recette parente | Suit la recette parente |
| `meal_plan_items` | Membres du foyer | Membres du foyer |
| `recipe_favorites` | `auth.uid()` = `user_id` | `auth.uid()` = `user_id` |

---

## Ecrans et navigation

### Entree : depuis le Menu

Nouvel item dans `app/(app)/menu/index.tsx` qui pointe vers `/(app)/meals/`.

### Arborescence

| Ecran | Fichier | Role |
|---|---|---|
| Planning hebdo | `app/(app)/meals/index.tsx` | Vue semaine flexible, repas par jour, FAB, suggestions |
| Catalogue | `app/(app)/meals/recipes/index.tsx` | Recherche, filtres, grille, sections foyer + systeme |
| Fiche recette | `app/(app)/meals/recipes/[id].tsx` | Hero, meta, portions ajustables, ingredients, etapes, CTA planifier |
| Creer recette | `app/(app)/meals/recipes/create.tsx` | Formulaire avec autocomplete ingredients |
| Ajouter au planning | `app/(app)/meals/add.tsx` | Bottom sheet : recette, date, type, cuisinier, portions |
| Historique | `app/(app)/meals/history.tsx` | Repas passes, frequence |
| Favoris | `app/(app)/meals/favorites.tsx` | Recettes favorites, acces rapide |

### Composants

| Composant | Fichier | Role |
|---|---|---|
| MealCard | `src/components/meals/MealCard.tsx` | Card repas dans le planning |
| RecipeCard | `src/components/meals/RecipeCard.tsx` | Card recette dans le catalogue |
| MealPlanDay | `src/components/meals/MealPlanDay.tsx` | Jour du planning avec ses repas |
| RecipeFilters | `src/components/meals/RecipeFilters.tsx` | Chips de filtres horizontaux |
| IngredientRow | `src/components/meals/IngredientRow.tsx` | Ligne ingredient dans la fiche |
| StepRow | `src/components/meals/StepRow.tsx` | Etape numerotee dans la fiche |

---

## Flux principaux

### Flux 1 : Planifier un repas

1. Planning → "+" → Choisir recette (catalogue)
2. Selectionner date + type de repas + cuisinier + portions
3. Confirmer
4. **Cote serveur :**
   - Cree `meal_plan_item`
   - Cree `Task` (title: "Cuisiner : {recette}", task_type: household, category: cooking, assigned_to: cuisinier, due_date: date, estimated_minutes: prep_time + cook_time)
   - Stocke `task_id` dans `meal_plan_item`
   - Ajoute les ingredients a la liste de courses active (cree la SharedList si aucune active)
   - Fusionne les quantites si ingredient deja present

### Flux 2 : Generer la liste de courses

1. Planning → Bouton "Liste de courses"
2. Bottom sheet : choix de periode (cette semaine, semaine prochaine, 2 semaines)
3. Options : fusionner avec liste en cours, exclure basiques
4. Confirmer
5. **Cote serveur :**
   - Query `meal_plan_items` sur la periode
   - Agrege les ingredients de toutes les recettes (quantites ajustees selon portions)
   - Cree ou met a jour une `SharedList` type `shopping`
   - Chaque `SharedListItem` recoit : title (ingredient), quantity (agregee), category (de l'ingredient)

### Flux 3 : Complétion d'un repas

1. Le cuisinier marque la tache "Cuisiner : X" comme faite
2. Bottom sheet existant "Comment tu t'es senti(e) ?" s'affiche
3. Rating enregistre → contribue au score d'equilibre et TLX hebdo
4. Flow identique a toute tache household, aucune modification du systeme existant

### Flux 4 : Supprimer un repas du planning

1. Swipe ou bouton supprimer sur un meal_plan_item
2. Confirmation
3. **Cote serveur :**
   - Supprime le `meal_plan_item`
   - Supprime la `Task` liee (si pas encore completee)
   - Soustrait les quantites d'ingredients de la liste de courses active
   - Supprime l'item de la liste si quantite tombe a 0

### Flux 5 : Creer une recette perso

1. Catalogue → "+"
2. Formulaire : titre, description, temps prep/cuisson, portions, difficulte, tags
3. Ingredients : autocomplete sur la table `ingredients`, quantite, unite, note
4. Etapes : ajout ordonne avec texte libre
5. Sauvegarder
6. Recette creee avec `source: 'user'`, `household_id` du foyer courant

### Flux 6 : Suggestions depuis l'historique

- **Frequents** : recettes les plus planifiees sur les 3 derniers mois
- **Pas cuisine depuis longtemps** : recettes utilisees au moins 2x mais absentes depuis > 3 semaines
- Affichees en carousel horizontal sur le planning, surtout visible en empty state

---

## Types TypeScript

```typescript
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type RecipeSource = 'system' | 'user';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  id: string;
  name: string;
  category: ShoppingItemCategory;
  default_unit: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  household_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  steps: { order: number; text: string }[];
  source: RecipeSource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  ingredients?: RecipeIngredient[];
  is_favorite?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  optional: boolean;
  note: string | null;
  ingredient?: Ingredient;
}

export interface MealPlanItem {
  id: string;
  household_id: string;
  recipe_id: string;
  date: string;
  meal_type: MealType;
  servings: number;
  assigned_to: string | null;
  task_id: string | null;
  created_by: string;
  created_at: string;
  recipe?: Recipe;
  assigned_profile?: Profile;
  task?: Task;
}

export interface RecipeFavorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}
```

---

## Hooks TanStack Query

| Hook | Fichier | Role |
|---|---|---|
| `useRecipes(filters?)` | `src/lib/queries/recipes.ts` | Catalogue avec filtres (tags, difficulte, recherche, source) |
| `useRecipe(id)` | `src/lib/queries/recipes.ts` | Fiche detaillee avec ingredients joints |
| `useCreateRecipe()` | `src/lib/queries/recipes.ts` | Mutation : recette perso du foyer |
| `useToggleFavorite()` | `src/lib/queries/recipes.ts` | Mutation : toggle favori |
| `useFavoriteRecipes()` | `src/lib/queries/recipes.ts` | Liste des favoris |
| `useIngredientSearch(query)` | `src/lib/queries/recipes.ts` | Autocomplete pour formulaire recette |
| `useMealPlan(weekStart)` | `src/lib/queries/meals.ts` | Planning de la semaine |
| `useCreateMealPlanItem()` | `src/lib/queries/meals.ts` | Mutation : cree item + tache + ingredients liste |
| `useDeleteMealPlanItem()` | `src/lib/queries/meals.ts` | Mutation : supprime item + tache + retire ingredients |
| `useMealHistory(months?)` | `src/lib/queries/meals.ts` | Historique et suggestions |
| `useGenerateGroceryList()` | `src/lib/queries/meals.ts` | Mutation : genere/fusionne SharedList |

---

## Seed du dataset

### Strategie

- ~300 recettes francaises courantes via migration Supabase
- ~200 ingredients normalises pre-remplis
- Idempotent : `ON CONFLICT DO NOTHING`
- Toutes les recettes systeme : `source = 'system'`, `household_id = null`

### Categories couvertes

| Categorie | Exemples | ~Nombre |
|---|---|---|
| Viandes | Poulet roti, boeuf bourguignon, blanquette | ~50 |
| Poissons | Saumon en papillote, moules-frites | ~30 |
| Vegetarien | Ratatouille, gratin legumes, galettes | ~40 |
| Pates & riz | Carbonara, risotto, pad thai maison | ~30 |
| Soupes | Soupe lentilles, veloute potiron | ~25 |
| Salades | Nicoise, cesar, chevre chaud | ~20 |
| Gratins & tartes | Quiche lorraine, gratin dauphinois | ~25 |
| Plats du monde | Tajine, curry, chili con carne | ~40 |
| Rapides (<30min) | Croque-monsieur, omelette, wraps | ~40 |

### Tags

`rapide` · `vegetarien` · `vegan` · `familial` · `batch-cooking` · `sans-gluten` · `economique` · `ete` · `hiver` · `fete`

### Normalisation des ingredients

- Un ingredient = un nom canonique ("tomate", pas "tomates concassees")
- Les variantes sont dans `recipe_ingredients.note` ("en des", "concassees")
- Unites standardisees : `g`, `kg`, `ml`, `cl`, `l`, `piece`, `cs`, `cc`, `botte`, `tranche`
- Basiques (sel, poivre, huile d'olive) marques `optional = true`

---

## Design UI

### Tokens utilises

Palette Cafe Cosy existante, aucun nouveau token necessaire :
- Terracotta (`#C4846C`) : CTA, accents, FAB
- Sauge (`#8BA888`) : succes, checkmarks, progression
- Miel (`#D4A959`) : badges difficulte moyenne
- Member colors : avatar cuisinier
- Background / Card / Border : tokens existants

### Principes

- Cards arrondies avec ombres subtiles (coherent avec le reste de l'app)
- Touch targets >= 44px
- Empty states avec emoji + CTA
- Carousel horizontal pour suggestions et recettes du foyer
- Grille 2 colonnes pour le catalogue
- Bottom sheet pour les actions contextuelles (ajout, generation)
- Barre de progression pour la liste de courses

---

## Hors scope V1

- Integration IA (generation de recettes, suggestions intelligentes)
- Lien avec le module Budget
- Informations nutritionnelles
- Photos prises par l'utilisateur pour ses recettes
- Partage de recettes entre foyers
- Import de recettes depuis URL
- Mode "batch cooking" avance (planification multi-portions sur plusieurs jours)
