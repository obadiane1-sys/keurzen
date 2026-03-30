# ROADMAP — Keurzen

## Principe directeur
**Lancer petit, lancer propre.**
Mieux vaut une app avec 4 fonctions qui marchent parfaitement qu'une app avec 8 fonctions bancales.

Un palier doit être **entièrement finalisé** avant de passer au suivant.
Aucun élargissement de scope sans décision explicite.

---

## Règle de travail avec Claude Code

1. Explorer
2. Planifier → attendre validation avant d'implémenter
3. Implémenter
4. Self-check
5. Vérification technique (lint, build)
6. Test manuel
7. Verdict

---

## Palier 1 — Fondations 🔴
*Bloquant absolu avant tout le reste*

- Auth / création de compte
- Création de foyer
- Flux d'invitation bout en bout
- Onboarding post-invitation de l'invité

**Sortie :** deux personnes peuvent créer et rejoindre un foyer depuis zéro.

---

## Palier 2 — Tâches 🟠
*Cœur du produit — doit être irréprochable*

### Gestion des tâches
- Créer / modifier / supprimer une tâche
- Assigner à un membre du foyer
- Marquer comme faite
- Récurrence simple (quotidien, hebdo)
- Vue liste + vue par membre

### Types de tâches
Les tâches ont un champ `type` :
- `household` → tâche du foyer, partagée, soumise au TLX
- `personal` → activité personnelle, aucun TLX, complétion directe sans friction

### Charge mentale à la complétion (tâches household uniquement)
À chaque fois qu'un membre marque une tâche `household` comme faite :
- Un modal/bottom sheet s'affiche immédiatement
- Question unique : **"Comment tu t'es senti·e sur cette tâche ?"**
- 3 niveaux : 🟢 Légère (1) — 🟡 Moyenne (2) — 🔴 Lourde (3)
- L'utilisateur répond en 2 secondes maximum
- Le score est stocké lié à : tâche + membre + timestamp

Pour les tâches `personal` : complétion directe, aucun écran supplémentaire.

**Sortie :** un foyer peut se répartir ses tâches, suivre qui fait quoi, et collecter des données de charge mentale sans friction.

---

## Palier 3 — Équilibre & charge mentale 🟠
*Le différenciant de Keurzen par rapport à une simple todo*

### Score d'équilibre
- Calcul du ratio tâches / score TLX par membre sur la semaine
- Seuil d'alerte configurable (ex. écart > 30%)
- Indicateur visuel sur le dashboard (pas d'alerte agressive)

### Vue comparative
- Affichage du score d'équilibre entre membres
- Basé sur les données de rating quotidien collectées au Palier 2
- Historique semaine par semaine

### Bilan TLX hebdomadaire (V1)
- Proposé **une fois par semaine**, pas à chaque tâche
- Format : 6 dimensions NASA-TLX complètes
- Déclenchement : notification douce le dimanche soir ou lundi matin
- Facultatif, l'utilisateur peut ignorer

### Notification hebdo
- Message doux type : *"Cette semaine, Ouss a pris 70% des tâches"*
- Jamais intrusif, jamais culpabilisant

**Sortie :** le foyer voit en un coup d'œil si la charge est équilibrée.

---

## Palier 4 — Budget 🟡
*Utile mais pas différenciant au lancement*

- Ajout d'une dépense
- Catégories de base
- Solde mensuel du foyer

**Sortie :** suivi basique des dépenses communes.

---

## Palier 5 — Prêt au lancement 🟢
*La dernière ligne droite avant publication*

- Notifications push (rappels tâches)
- États vides soignés (foyer vide, aucune tâche, aucune dépense)
- Profil utilisateur (prénom, photo)
- Gestion du compte (modification MDP, suppression)
- Revue design globale (cohérence palette Keurzen)
- Tests bout en bout iOS et Android

**Sortie :** app publiable sur l'App Store et le Play Store.

---

## Après le lancement — V2

- Suggestions de réassignation actives basées sur l'historique TLX
- Détection automatique du déséquilibre chronique
- Mode sombre
- Widget iOS / Android
- Rapport hebdomadaire automatique par email / notif
- Paywall / abonnement premium

---

## Design System

| Token | Valeur |
|---|---|
| Mint | `#88D4A9` |
| Blue | `#AFCBFF` |
| Coral | `#FFA69E` |
| Lavender | `#BCA7FF` |
| Navy | `#212E44` |
| Text | `#1E293B` |
| Background | `#F7F9FC` |

Style : premium pastel, doux, clair, rassurant, aéré.
Coins arrondis, ombres très subtiles, CTA principale claire. Pas de surcharge visuelle.

---

## Estimation de timing

| Palier | Durée estimée |
|---|---|
| 1 — Fondations | 1 semaine |
| 2 — Tâches | 1 semaine |
| 3 — Équilibre / TLX | 1 semaine |
| 4 — Budget | 3–4 jours |
| 5 — Lancement | 3–4 jours |
| **Total** | **~5 semaines** |
