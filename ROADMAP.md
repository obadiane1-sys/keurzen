# ROADMAP — Keurzen

## Product
Keurzen — premium household management app focused on fairness, time visibility, and mental load reduction.

---

## Principe directeur
Lancer petit, lancer propre.
Un palier doit être entièrement finalisé avant de passer au suivant.
Aucun refactor global, aucun élargissement de scope sans décision explicite.
Chaque fonctionnalité est implémentée simultanément sur mobile ET web.

---

## Phase 1 — Foundation ✅
- Project setup
- Design system (tokens, components)
- Auth (login, signup, forgot password)
- Routing (Expo Router, protected shell)
- Base data model
- Supabase setup (RLS, migrations 001–005)
- Seed data
- Protected app shell

## Phase 2 — Core household workflows ✅
- Household create / join by code / join by invite link / join by email
- Member colors
- Member roles (owner / member)
- Privacy model (RLS per household)
- Household settings screen
- Invite screen (link / email / code)
- Email invitation via Resend Edge Function

## Phase 3 — Tasks ✅
- Create / edit / delete task
- Statuses (todo / in_progress / done / overdue)
- Overdue logic (Edge Function mark-overdue-tasks)
- Filters
- List view
- Detail view

## Phase 4 — Calendar ✅
- Day / week / month
- Navigation
- Filters
- Empty states
- Task quick access

## Phase 5 — Time tracking ✅
- Manual logs
- Totals by task
- Totals by member
- Charts

## Phase 6 — TLX ✅
- Weekly raw TLX entry
- One entry per week
- Score calculation
- TLX info sheet
- Delta vs previous week

## Phase 7 — Dashboard & imbalance ✅
- KPI cards
- Weekly balance card
- Member distribution
- Alerts
- Weekly stats computation (Edge Function compute-weekly-stats)

## Phase 8 — Budget ✅
- Expenses
- Categories
- Split modes (equal / percentage / fixed)
- Summaries
- Charts

---

## Phase 9 — Invitation flow 🔧 EN COURS

### Bugs connus à corriger
- [ ] `_layout.tsx` écrase la redirection vers la page sécurité post-invitation
- [ ] Utilisateur invité atterrit sur le dashboard au lieu de la page sécurité
- [ ] Suppression d'invitation en attente échoue (logique de révocation Auth à supprimer)

### Règles impératives à respecter
- Magic Link → deep link `keurzen://` → ouvre l'app directement (pas de page web)
- `join/[token].tsx` : après `accept-invitation` → `setNeedsPasswordSetup(true)` → redirect sécurité
- `_layout.tsx` : évalue `needsPasswordSetup` AVANT la redirection dashboard
- Page sécurité : après changement mot de passe → `setNeedsPasswordSetup(false)` → dashboard
- Suppression invitation : `DELETE FROM invitations WHERE id = $1` uniquement, zéro révocation Auth

### Checklist
- [x] Push token registration
- [x] Morning digest (Edge Function morning-digest)
- [x] Overdue notifications (Edge Function mark-overdue-tasks)
- [x] Magic Link génération et envoi
- [x] Utilisateur ajouté au foyer après Magic Link
- [x] Email pré-rempli verrouillé sur le signup invitation
- [x] Protection email existant au signup
- [ ] Deep link ouvre l'app directement (pas de page web intermédiaire)
- [ ] Redirection post-invitation → page sécurité (pas dashboard)
- [ ] Définition mot de passe post-invitation → redirection dashboard
- [ ] Suppression invitation en attente sans erreur
- [ ] 30 min reminder before due tasks
- [ ] In-app notification center

**Condition de sortie :**
Le scénario suivant fonctionne de bout en bout sur mobile ET web :
invitation envoyée → Magic Link reçu → clic → app ouverte → ajouté au foyer → page sécurité → mot de passe défini → dashboard.

---

## Phase 10 — Polish 🔲
- Help center
- Legal pages (CGU, privacy)
- Settings complets (profil, sécurité, préférences notifications)
- États vides soignés sur tous les écrans
- QA hardening (mobile ET web)
- Accessibilité audit
- Analytics hooks si nécessaire
- Revue design globale (cohérence palette Keurzen)
- Test de bout en bout iOS, Android et web

**Condition de sortie :**
L'app est soumise aux stores et fonctionnelle de bout en bout sur toutes les plateformes.

---

## Known bugs — à corriger avant Phase 10
- [ ] `join/[token].tsx` → redirige vers dashboard au lieu de la page sécurité
- [ ] Suppression invitation en attente → erreur 500 (révocation Auth à supprimer)
- [ ] Deep link → ouvre encore la page web au lieu de l'app

---

## Post-launch — V2

### Rééquilibrage actif
- [ ] Détection du déséquilibre : calcul ratio tâches / temps par membre (déjà en Phase 7)
- [ ] Suggestions de réassignation de tâches récurrentes (proposé, jamais automatique)
- [ ] L'utilisateur accepte ou ignore chaque suggestion

### Premium
- [ ] Rapport hebdomadaire automatique du foyer
- [ ] Mode sombre
- [ ] Widget iOS / Android (tâches du jour en accueil)
- [ ] Freemium paywall

### Web
- [ ] Surface web minimale si deep link insuffisant sur certains appareils

---

## Palette de design

| Rôle | Nom | Hex |
|---|---|---|
| CTA principale | Mint | #88D4A9 |
| Sélection / info | Blue | #AFCBFF |
| Alerte douce | Coral | #FFA69E |
| TLX / charge mentale | Lavender | #BCA7FF |
| Header / nav | Navy | #212E44 |
| Texte principal | Text | #1E293B |
| Bordures | Light Gray | #E2E8F0 |
| Fond global | Background | #F7F9FC |

All tokens in `src/constants/tokens.ts` — never hardcode values.

---

## Estimation de timing

| Phase | Statut | Durée estimée |
|---|---|---|
| 1 à 8 | ✅ Terminées | — |
| 9 — Invitation flow | 🔧 En cours | 1 semaine |
| 10 — Polish | 🔲 À faire | 1 semaine |
| **Lancement** | | **~2 semaines** |

---

## Règles de travail avec Claude Code

1. Explorer
2. Planifier → attendre validation avant d'implémenter
3. Implémenter
4. Self-check
5. Vérification technique (lint, build)
6. Test manuel (mobile ET web)
7. Verdict

Ne jamais passer à l'étape suivante sans avoir bouclé la précédente.
Ne jamais élargir le scope sans décision explicite.
