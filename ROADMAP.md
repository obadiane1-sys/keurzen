# ROADMAP

## Product
Keurzen — premium household management app focused on fairness, time visibility, and mental load reduction.

## MVP
- Auth
- Onboarding after signup
- Household creation / join / invite
- Tasks CRUD
- Calendar
- Time tracking
- NASA-TLX weekly entry
- Weekly imbalance detection
- Dashboard
- Budget
- Notifications
- Settings / Help / Legal

---

## Phase 1 — Foundation ✅
- project setup
- design system (tokens, components)
- auth (login, signup, forgot password)
- routing (Expo Router, protected shell)
- base data model
- Supabase setup (RLS, migrations 001-005)
- seed data
- protected app shell

## Phase 2 — Core household workflows ✅
- household create / join by code / join by invite link / join by email
- member colors
- member roles (owner / member)
- privacy model (RLS per household)
- household settings screen
- invite screen (link / email / code / contacts placeholder)
- email invitation via Resend Edge Function

## Phase 3 — Tasks ✅
- create / edit / delete task
- statuses (todo / in_progress / done / overdue)
- overdue logic (Edge Function mark-overdue-tasks)
- filters
- list view
- detail view

## Phase 4 — Calendar ✅
- day / week / month
- navigation
- filters
- empty states
- task quick access

## Phase 5 — Time tracking ✅
- manual logs
- totals by task
- totals by member
- charts

## Phase 6 — TLX ✅
- weekly raw TLX entry
- one entry per week
- score calculation
- TLX info sheet
- delta vs previous week

## Phase 7 — Dashboard & imbalance ✅
- KPI cards
- weekly balance card
- member distribution
- alerts
- weekly stats computation (Edge Function compute-weekly-stats)

## Phase 8 — Budget ✅
- expenses
- categories
- split modes (equal / percentage / fixed)
- summaries
- charts

## Phase 9 — Notifications 🚧
- [x] push token registration
- [x] morning digest (Edge Function morning-digest)
- [x] overdue notifications (Edge Function mark-overdue-tasks)
- [ ] 30 min reminder before due tasks
- [ ] in-app notification center

## Phase 10 — Polish 🔲
- help center
- legal pages (CGU, privacy)
- settings (profile, security, notification preferences)
- QA hardening
- accessibility audit
- analytics hooks if needed

---

## In progress
- Phase 9 — Notifications (partial)

## Done
- Phase 1 — Foundation
- Phase 2 — Core household workflows
- Phase 3 — Tasks
- Phase 4 — Calendar
- Phase 5 — Time tracking
- Phase 6 — TLX
- Phase 7 — Dashboard & imbalance
- Phase 8 — Budget

## Known bugs — to fix before Phase 10
- [ ] Invitation flow: after signup, no redirect occurs
- [ ] Invitation flow: login fails after signup with same credentials

## Post-launch — V2
- [ ] Task rebalancing suggestions (proposed reassignments, never automatic)
- [ ] Dark mode
- [ ] iOS / Android home screen widget
- [ ] Freemium paywall
