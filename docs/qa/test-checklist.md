# QA Test Checklist

Run before marking any feature as done.

---

## Auth

- [ ] signup works with valid email/password
- [ ] strong password rules are enforced
- [ ] reset password email is sent
- [ ] reset password message is generic (no user existence leak)
- [ ] login works
- [ ] logout clears session and redirects to login
- [ ] protected routes redirect unauthenticated users

## Onboarding

- [ ] onboarding appears only once, right after signup
- [ ] onboarding does not reappear on subsequent logins
- [ ] skipping onboarding works

## Household

- [ ] household creation works
- [ ] invite code is generated
- [ ] join by code works
- [ ] join by invite link (deep link `keurzen://join/<token>`) works
- [ ] invite by email sends the email (check Resend dashboard)
- [ ] email invitation link opens the app and joins the household
- [ ] member list updates after join
- [ ] household data is isolated — member cannot see another household's data

## Tasks

- [ ] task creation works (required fields validated)
- [ ] task edit works
- [ ] task deletion works
- [ ] status transitions work (todo → in_progress → done)
- [ ] overdue badge appears for past-due tasks
- [ ] overdue Edge Function marks tasks correctly
- [ ] filters work (by assignee, status, category)

## Calendar

- [ ] week view renders tasks on correct days
- [ ] navigation between weeks works
- [ ] empty state appears when no tasks
- [ ] tapping a task opens task detail

## Time tracking

- [ ] manual time log creation works
- [ ] totals aggregate correctly per task and per member
- [ ] charts render without crash

## TLX

- [ ] weekly TLX entry can be submitted once per week
- [ ] submitting again is blocked (one-per-week rule)
- [ ] TLX score is calculated correctly
- [ ] delta vs previous week is displayed correctly

## Dashboard

- [ ] KPI cards show correct values
- [ ] weekly balance reflects actual task distribution
- [ ] imbalance alerts are created when threshold exceeded
- [ ] alerts are not duplicated

## Budget

- [ ] expense creation works
- [ ] equal split calculates correctly
- [ ] custom percentage split works
- [ ] budget summary matches expenses

## Notifications

- [ ] push token is registered on app start (authenticated)
- [ ] morning digest sends at configured hour
- [ ] overdue notification fires after tasks are marked overdue
- [ ] notification preferences are respected

## General UI

- [ ] loading states appear during async operations
- [ ] empty states appear when lists are empty
- [ ] error states appear on network failure
- [ ] touch targets are comfortable (≥ 44px)
- [ ] no visual regression on tab screens
- [ ] no console errors or warnings
- [ ] double-submit is prevented (buttons disable while loading)

---

## P0 — Blocking (must pass before shipping)
Auth · Household isolation · Task CRUD · Overdue logic · Push token registration

## P1 — High priority
Time log accuracy · Dashboard KPI accuracy · TLX one-per-week · Budget splits · Imbalance alerts

## P2 — Nice to have
Empty states · Touch targets · No duplicate scheduler runs · Legal pages accessible
