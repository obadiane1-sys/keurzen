# ROADMAP — Keurzen

## Principe directeur
**Lancer petit, lancer propre.**
Mieux vaut une app avec 4 fonctions qui marchent parfaitement qu'une app avec 8 fonctions bancales.

Keurzen est une app de gestion de foyer **et coach**, qui guide les couples vers un foyer equilibre via le suivi des taches, la mesure de la charge mentale (TLX) et des conseils hebdomadaires.

Un palier doit etre **entierement finalise** avant de passer au suivant.
Aucun elargissement de scope sans decision explicite.

---

## Regle de travail avec Claude Code

1. Explorer
2. Planifier → attendre validation avant d'implementer
3. Implementer (mobile ET web simultanement)
4. Self-check
5. Verification technique (lint, build)
6. Test manuel
7. Verdict

---

## Palier 1 — Fondations ✅
*Bloquant absolu avant tout le reste*

- ✅ Auth / creation de compte (login, signup, verify-email)
- ✅ Creation de foyer
- ✅ Flux d'invitation bout en bout (magic link, join code)
- ✅ Onboarding post-invitation de l'invite
- ✅ Profil utilisateur (prenom, photo, securite)

**Sortie :** deux personnes peuvent creer et rejoindre un foyer depuis zero.

---

## Palier 2 — Taches ✅
*Coeur du produit — doit etre irreprochable*

### Gestion des taches
- ✅ Creer / modifier / supprimer une tache
- ✅ Assigner a un membre du foyer
- ✅ Marquer comme faite
- ✅ Recurrence simple (quotidien, hebdo, bimensuel, mensuel)
- ✅ Vue liste avec filtres par statut
- ✅ Categories (menage, cuisine, courses, admin, etc.)
- ✅ Zones (cuisine, salle de bain, etc.)

### Types de taches
- ✅ `household` → tache du foyer, partagee, soumise au TLX
- ✅ `personal` → activite personnelle, aucun TLX, completion directe

### Charge mentale a la completion (taches household uniquement)
- ✅ Bottom sheet CompletionRatingSheet a la completion
- ✅ Question unique : "Comment tu t'es senti·e sur cette tache ?"
- ✅ 3 niveaux : Legere (1) — Moyenne (2) — Lourde (3)
- ✅ Score stocke lie a : tache + membre + timestamp

**Sortie :** un foyer peut se repartir ses taches, suivre qui fait quoi, et collecter des donnees de charge mentale sans friction.

---

## Palier 3 — Equilibre & charge mentale ✅
*Le differenciant de Keurzen par rapport a une simple todo*

### Score d'equilibre
- ✅ Calcul du ratio taches / score TLX par membre sur la semaine
- ✅ Seuil d'alerte configurable (IMBALANCE_THRESHOLD)
- ✅ Indicateur visuel sur le dashboard

### Vue comparative
- ✅ Affichage du score d'equilibre entre membres
- ✅ Historique semaine par semaine (weekly stats)

### Bilan TLX hebdomadaire
- ✅ Propose une fois par semaine (ecran TLX dedie)
- ✅ Format : 6 dimensions NASA-TLX completes
- ✅ Facultatif

### Alertes & notifications
- ✅ Alertes de desequilibre (inline sur le dashboard, pas d'ecran dedie)
- ✅ Notifications push (rappels taches, bilan hebdo)
- ✅ Edge Functions : `compute-weekly-stats`, `send-weekly-review-push`
- ✅ Ton doux, jamais intrusif

**Sortie :** le foyer voit en un coup d'oeil si la charge est equilibree.

---

## Palier 4 — Modules complementaires 🟡
*Enrichissent l'experience au quotidien*

### Budget (mobile uniquement)
- ✅ Ajout d'une depense
- ✅ Categories de base
- ❌ Parite web manquante

### Repas & recettes (mobile uniquement)
- ✅ Planning de repas
- ✅ Recettes (creation, favoris, historique)
- ❌ Parite web manquante

### Messages
- ✅ Conversations entre membres du foyer (mobile + web)
- ✅ Notifications push chat

### Listes
- ✅ Listes partagees (mobile + web)

### A faire
- ❌ Budget → implementer la parite web
- ❌ Meals/Recipes → implementer la parite web
- ❌ TLX → implementer la parite web (ecran TLX hebdo)

**Sortie :** le foyer a tous les outils du quotidien sur les deux plateformes.

---

## Palier 5 — Pret au lancement 🟠
*La derniere ligne droite avant publication*

### Fait
- ✅ Notifications push (rappels taches, bilan hebdo, chat)
- ✅ Etats vides soignes (foyer vide, aucune tache, etc.)
- ✅ Profil utilisateur (prenom, photo)
- ✅ Gestion du compte (modification MDP, securite)
- ✅ Onboarding guide apres inscription

### A faire
- ❌ Parite web complete (budget, meals, TLX)
- ❌ Revue design globale (coherence Cafe Cosy sur tous les ecrans)
- ❌ Ecran de time tracking dedie (type defini, pas d'UI)
- ❌ Ecran d'alertes dedie (donnees existent, affichage inline uniquement)
- ❌ Tests bout en bout iOS et Android
- ❌ Build de production + deploiement web (Vercel)

**Sortie :** app publiable sur l'App Store, le Play Store et le web.

---

## Apres le lancement — V2

- Suggestions de reassignation actives basees sur l'historique TLX (coach proactif)
- Detection automatique du desequilibre chronique
- Mode sombre
- Widget iOS / Android
- Rapport hebdomadaire automatique par email
- Paywall / abonnement premium

---

## Design System — Palette "Cafe Cosy"

### Brand (accents)
| Token | Valeur | Usage |
|---|---|---|
| Terracotta | `#C4846C` | CTA principale, FAB, liens actifs |
| Sauge | `#8BA888` | Succes, validation |
| Miel | `#D4A959` | Warnings, highlights |
| Rose | `#D4807A` | Alertes douces, retard |
| Prune | `#9B8AA8` | Charge mentale, TLX |

### Texte & Fonds
| Token | Valeur | Usage |
|---|---|---|
| Text | `#3D2C22` | Texte principal (brun profond) |
| Secondary | `#7A6B5D` | Texte secondaire |
| Background | `#FAF6F1` | Fond global (creme) |
| Card | `#FFFDF9` | Fond cartes (blanc casse) |
| Border | `#E8DFD5` | Bordures (sable) |

Style : premium "Cafe Cosy" — chaleureux, calme, flat UI, ombres subtiles brunes.
Typographie Nunito. Coins arrondis 12-16px. Touch targets >= 44px. Pas de gradients, pas de bleu froid.

Source de verite : `apps/mobile/src/constants/tokens.ts` + `apps/web/src/app/globals.css`
