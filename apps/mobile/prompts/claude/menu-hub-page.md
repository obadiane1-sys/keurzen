# Menu Hub Page — Reduire les onglets a 4 + Menu

## Objectif

Restructurer la navigation bottom tabs de Keurzen pour passer de 6 onglets a 5 onglets maximum, en regroupant les features secondaires dans un ecran "Menu" (hub). Cela suit les best practices iOS/Android (max 5 tabs) et donne acces a toutes les features sans surcharger la barre.

## Contexte

Actuellement 6 tabs : Dashboard, Taches, Listes, Agenda, Budget, Profil.
Probleme : trop d'onglets, certaines features (TLX, analyse/rapport hebdo, budget) sont enfouies ou invisibles.

-----

## REGLES ABSOLUES

1. **NE PAS toucher la logique metier** — hooks, stores, services, queries restent identiques
2. **NE PAS modifier le schema DB** ni les Edge Functions
3. **NE PAS supprimer les ecrans existants** — ils restent accessibles, seule la navigation change
4. **Utiliser les design tokens** de `src/constants/tokens.ts` — jamais hardcoder de valeurs
5. **Mobile ET web** — chaque composant doit fonctionner sur les deux plateformes Expo
6. **Touch targets >= 44px** partout
7. **Flat design** — pas de shadows, pas de degrades

-----

## NOUVELLE STRUCTURE DES TABS

```
[Dashboard] [Taches] [Listes] [Agenda] [Menu]
```

Les 4 premiers onglets restent identiques. L'onglet "Menu" remplace "Budget" et "Profil" en les regroupant dans un hub.

-----

## ECRAN MENU — DESIGN

L'ecran Menu est un hub premium organise en sections. Pattern inspire de apps comme Revolut, N26, Notion (page "More").

### Layout general

```
SafeAreaView bg=Colors.background
  ScrollView paddingHorizontal=20 paddingBottom=32

    [Profile Card]  ← carte cliquable vers profil
    [Quick Actions]  ← grille 2x2 pour les features principales
    [Section: Foyer]  ← liste de rows
    [Section: Outils]  ← liste de rows
    [Section: Compte]  ← liste de rows
    [App version + deconnexion]
```

### 1. Profile Card (en haut)

```
┌─────────────────────────────────────────────┐
│  [Avatar 52px]  Prenom Nom          [>]     │
│                 email@example.com            │
└─────────────────────────────────────────────┘
```

- bg: Colors.backgroundCard, border 1.5px Colors.border, radius 20
- TouchableOpacity → `/(app)/settings/profile`
- Avatar reel (Image) ou fallback initiales (bg Colors.mint)
- Nom en 18px bold navy, email en 14px textSecondary
- Chevron right en textMuted

### 2. Quick Actions (grille 2x2)

Quatre cartes cote a cote (2 colonnes, 2 rangees), gap 12px.

Chaque carte :
- bg: Colors.backgroundCard, border 1.5px Colors.border, radius 16
- Padding 16px
- Icone dans un carre 44x44 radius 12, bg couleur accent a 18%
- Label 14px semibold navy en dessous de l'icone (center)
- TouchableOpacity activeOpacity={0.85}

```
┌──────────────┐  ┌──────────────┐
│   [Budget]   │  │  [Rapport]   │
│   💰 icon    │  │  📊 icon     │
│   Budget     │  │  Analyse     │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  [Charge]    │  │ [Inviter]    │
│   🧠 icon    │  │  ✉️ icon     │
│   TLX        │  │  Inviter     │
└──────────────┘  └──────────────┘
```

| Carte | Icone Ionicons | Couleur accent | Route |
|---|---|---|---|
| Budget | `wallet-outline` / `wallet` | Colors.warning | `/(app)/budget` |
| Analyse | `bar-chart-outline` / `bar-chart` | Colors.lavender | `/(app)/dashboard/analyse` (a creer) ou modale |
| TLX | `pulse-outline` / `pulse` | Colors.coral | `/(app)/dashboard/tlx` |
| Inviter | `person-add-outline` / `person-add` | Colors.blue | `/(app)/settings/invite` |

### 3. Section "Foyer"

Titre de section : "Foyer" en 13px semibold textSecondary uppercase, marginBottom 8

```
┌─────────────────────────────────────────────┐
│  [🏠]  Mon foyer                       [>]  │
│  [👥]  Membres                         [>]  │
│  [✉️]  Invitations                     [>]  │
└─────────────────────────────────────────────┘
```

- Card groupee (bg backgroundCard, border 1.5px, radius 16)
- Chaque row : icone 40x40 + label 16px + chevron
- Separateur entre rows : 1px Colors.border (pas sur le dernier)

| Row | Icone | Couleur | Route |
|---|---|---|---|
| Mon foyer | `home-outline` | Colors.mint | `/(app)/settings/household` |
| Invitations | `mail-outline` | Colors.blue | `/(app)/settings/invite` |

### 4. Section "Compte"

```
┌─────────────────────────────────────────────┐
│  [🔒]  Securite                        [>]  │
│  [🔔]  Notifications                   [>]  │
│  [❓]  Aide                            [>]  │
│  [📄]  Conditions d'utilisation        [>]  │
│  [🛡️]  Confidentialite                 [>]  │
└─────────────────────────────────────────────┘
```

| Row | Icone | Couleur | Route |
|---|---|---|---|
| Securite | `lock-closed-outline` | Colors.lavender | `/(app)/settings/security` |
| Notifications | `notifications-outline` | Colors.coral | `/(app)/settings/notifications` |
| Aide | `help-circle-outline` | Colors.textSecondary | `/(app)/settings/help` |
| CGU | `document-text-outline` | Colors.textSecondary | `/(app)/settings/cgu` |
| Confidentialite | `shield-checkmark-outline` | Colors.textSecondary | `/(app)/settings/privacy` |

### 5. Footer

- Bouton "Se deconnecter" : texte 16px Colors.error, center, paddingVertical 14
- Version app en dessous : "Keurzen v1.0.0" en 12px textMuted center

-----

## FICHIERS A MODIFIER

### 1. `app/(app)/_layout.tsx` — Modifier le TAB_CONFIG

Remplacer les 6 onglets par 5 :

```typescript
const TAB_CONFIG = [
  { name: 'dashboard', label: 'Accueil', icon: 'grid' as const, color: Colors.coral },
  { name: 'tasks', label: 'Taches', icon: 'checkmark-circle' as const, color: Colors.mint },
  { name: 'lists', label: 'Listes', icon: 'list' as const, color: Colors.blue },
  { name: 'calendar', label: 'Agenda', icon: 'calendar' as const, color: Colors.lavender },
  { name: 'menu', label: 'Menu', icon: 'menu' as const, color: Colors.textSecondary },
] as const;
```

Cacher les anciens tabs `budget` et `settings` avec `href: null` (comme `notifications`).

### 2. `app/(app)/menu/` — CREER le dossier + fichiers

- `app/(app)/menu/_layout.tsx` — Stack navigator simple (headerShown: false)
- `app/(app)/menu/index.tsx` — Ecran Menu hub (le design ci-dessus)

### 3. Ecrans existants — NE PAS MODIFIER

Les ecrans `budget/*`, `settings/*`, `dashboard/tlx` restent tels quels.
Seules les routes de navigation changent (ils sont accedes depuis le menu au lieu des tabs).

-----

## COMPOSANTS A CREER

### `src/components/menu/QuickActionCard.tsx`

```typescript
interface QuickActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}
```

Card reutilisable pour la grille 2x2. flex: 1, minWidth calculee.

### `src/components/menu/MenuSection.tsx`

```typescript
interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}
```

Wrapper : titre de section + card groupee avec separateurs automatiques.

### `src/components/menu/MenuRow.tsx`

```typescript
interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
  danger?: boolean;
  showDivider?: boolean;
}
```

Row reutilisable. Meme pattern que `SettingsRow` dans `settings/index.tsx` mais avec le design premium du menu.

-----

## PALETTE DE COULEURS

Utiliser exclusivement les tokens de `src/constants/tokens.ts` :

- Fond : `Colors.background`
- Cards : `Colors.backgroundCard` (#FFFFFF)
- Bordures : `Colors.border` avec 1.5px
- Texte principal : `Colors.navy` ou `Colors.textPrimary`
- Texte secondaire : `Colors.textSecondary`
- Texte muted : `Colors.textMuted`
- Accents : `Colors.mint`, `Colors.blue`, `Colors.coral`, `Colors.lavender`, `Colors.warning`
- Erreur/danger : `Colors.error`

-----

## ANIMATIONS

Entree staggered des sections (meme pattern que le dashboard) :
- Opacity 0 → 1, translateY 12 → 0
- Duration 400ms, delay 40ms entre sections
- Easing.out(Easing.ease)
- useNativeDriver: true

-----

## VERIFICATION AVANT DE TERMINER

1. Relire chaque fichier modifie — aucun fichier hors scope touche
2. Couleurs 100% issues des tokens
3. Pas de shadow / elevation
4. Taille texte >= 12px
5. Touch targets >= 44px
6. `npx tsc --noEmit` → 0 erreur
7. Les 5 tabs s'affichent correctement
8. Budget et Settings sont caches des tabs mais accessibles via Menu
9. Toutes les routes existantes fonctionnent encore
10. Mobile ET web

-----

## SCENARIOS DE TEST MANUEL

1. **Ouvrir l'app** → 5 onglets visibles (Accueil, Taches, Listes, Agenda, Menu)
2. **Tap sur Menu** → ecran hub avec profil, quick actions, sections
3. **Tap sur "Budget"** dans quick actions → page Budget s'ouvre
4. **Tap sur "TLX"** dans quick actions → page TLX s'ouvre
5. **Tap sur la carte profil** → page edition profil
6. **Tap sur "Se deconnecter"** → modale de confirmation → deconnexion
7. **Scroll complet** → toutes les sections visibles
8. **Web** → layout identique, hover states fonctionnels sur les rows
9. **Retour depuis une sous-page** → retour au menu hub
