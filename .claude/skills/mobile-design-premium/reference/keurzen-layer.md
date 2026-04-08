# Couche Keurzen — Regles Specifiques

## Identite produit

Keurzen est une app de gestion de foyer **premium** focalisee sur l'equite, la visibilite du temps et la reduction de la charge mentale.

Le ton visuel est **"Cafe Cosy"** : on est dans un salon chaleureux, organise, calme. Pas un bureau d'entreprise, pas un jeu video, pas un outil corporate.

## Modules et leur expression visuelle

| Module | Couleur dominante | Ton |
|--------|-------------------|-----|
| Tasks | `terracotta` | Actif, organisationnel |
| Calendar | `terracotta` | Structurant |
| Time tracking | `miel` | Informatif, neutre |
| TLX (charge mentale) | `prune` | Reflexif, introspectif |
| Dashboard / Stats | Mix equilibre | Vue d'ensemble |
| Alerts (desequilibre) | `rose` | Doux mais attentif |
| Budget | `miel` | Pragmatique |
| Messages | `terracotta` | Conversationnel |
| Settings | Neutre (`textSecondary`) | Utilitaire |

## Mascotte

La mascotte Keurzen est une petite maison kawaii : pas de bras, pas de jambes, yeux ouverts, expression calme et premium.

- Utiliser `<Mascot />` ou `<KeurzenMascot />`
- Present sur : onboarding, invitations, etats vides
- Jamais dans les ecrans de donnees (dashboard, listes)
- Expression adaptee au contexte (neutre, contente, pensive)

## Patterns UX Keurzen

### Cartes de tache

```
+------------------------------------------+
|  [Avatar] Nom de la tache      [Badge]   |
|           Assignee a Marie               |
|           Echeance : demain              |
+------------------------------------------+
```

- Bordure gauche coloree selon priorite ou membre
- Badge de statut en haut a droite
- Avatar du membre assigne
- Touch target : toute la carte est cliquable

### Dashboard

- Cartes de synthese en haut (score equite, streak, charge)
- Graphiques de repartition en dessous
- Conseil hebdomadaire en bas
- Pas de surcharge : max 4-5 cartes visibles sans scroll

### Etats vides

Toujours avec la mascotte et un message encourageant :
- "Aucune tache pour le moment" (pas "Pas de donnees")
- "Ajoutez votre premiere tache" (pas "Commencer")
- Ton chaleureux, jamais technique

### Feedback utilisateur

- Succes : toast vert (sauge) discret, disparait en 3s
- Erreur : toast rose, reste visible jusqu'au dismiss
- Loading : Loader centre, fond background
- Confirmation destructive : modale avec 2 boutons clairs

## Hierarchie typographique

| Niveau | Token | Weight | Usage |
|--------|-------|--------|-------|
| H1 | `fontSize['2xl']` (24) | `bold` | Titre d'ecran |
| H2 | `fontSize.xl` (20) | `bold` | Titre de section |
| H3 | `fontSize.lg` (18) | `semibold` | Sous-section |
| Body | `fontSize.base` (15) | `regular` | Corps de texte |
| Caption | `fontSize.sm` (13) | `regular` | Labels, meta |
| Micro | `fontSize.xs` (11) | `medium` | Badges, timestamps |

## Navigation

- Tab bar en bas avec 4-5 onglets
- Header avec titre + action a droite
- Back button sur les ecrans enfants
- Pas de hamburger menu

## Regles metier impactant l'UI

1. **Un TLX par semaine** — si deja rempli, afficher le resultat, pas le formulaire
2. **Scores d'equite** — toujours afficher les deux membres cote a cote
3. **Alertes desequilibre** — ton doux ("Il semble que...", pas "Alerte!")
4. **Invitations** — email pre-rempli et verrouille si venu d'une invitation
5. **Onboarding** — affiche une seule fois apres signup

## Dual-platform : regles de parite

### Ce qui est identique

- Tokens (couleurs, typo, spacing) — memes valeurs
- Logique metier (hooks TanStack, stores Zustand)
- Structure de donnees et types

### Ce qui differe

| Aspect | Mobile (Expo/RN) | Web (Next.js/React) |
|--------|-------------------|---------------------|
| Navigation | Expo Router / Stack | Next.js App Router |
| Composants | React Native (`View`, `Text`) | HTML (`div`, `p`, `span`) |
| Touch | `TouchableOpacity`, `Pressable` | `button`, `a`, hover states |
| Animations | Reanimated 3 | CSS transitions / Framer Motion |
| Layout | `flexDirection: 'column'` par defaut | `display: flex` ou `grid` |
| Responsive | Pas de breakpoints (mobile-first) | Breakpoints sm/md/lg/xl |

### Workflow dual-platform

1. Implementer le mobile en premier (composants natifs)
2. Adapter pour le web (HTML/CSS equivalent)
3. Partager la logique (hooks, stores, types)
4. Lister les fichiers des deux cotes dans chaque PR

## Anti-patterns Keurzen

| Anti-pattern | Pourquoi c'est faux |
|-------------|---------------------|
| Ton agressif dans les alertes | Keurzen est bienveillant, pas punitif |
| Couleurs froides (bleu, gris pur) | La palette est chaude (bruns, terracotta) |
| Gradients | Flat UI strict |
| Ombres fortes | Ombres subtiles (opacity 0.04-0.08) |
| Ecrans surcharges | Max 4-5 elements visibles sans scroll |
| Texte < 11px | Minimum absolu |
| Dashboard sans contexte | Toujours montrer la periode, les membres |
| Notifications intrusives | Discret et utile, jamais intrusif |
