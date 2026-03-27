# QA Pass — Keurzen

Lis CLAUDE.md, docs/product/dod.md et docs/qa/test-checklist.md avant de commencer.

Je veux produire la check-list de recette pour : $ARGUMENTS

## Ce que j'attends

### 1. Analyse du scope
- Lire le code de la feature concernée
- Identifier les flux utilisateur principaux
- Identifier les modules adjacents pouvant régresser

### 2. Check-list de recette

#### Fonctionnel — happy path
- [ ] Scénario nominal pas à pas avec résultat attendu

#### Cas limites
- [ ] Données vides / nulles
- [ ] Champs manquants dans le formulaire
- [ ] Liste vide (empty state visible ?)
- [ ] Un seul élément vs plusieurs

#### Cas d'erreur
- [ ] Réseau coupé
- [ ] Session expirée / token invalide
- [ ] Permissions insuffisantes (RLS)
- [ ] Doublon (ex : TLX déjà soumis cette semaine)

#### Régression
- [ ] Modules adjacents non cassés
- [ ] Navigation non impactée
- [ ] Pas de perte de données

### 3. Priorisation des risques
- P0 = bloquant (data loss, auth cassée, crash)
- P1 = dégradé (feature incomplète, UX brisée)
- P2 = cosmétique (espacement, couleur)

## Sortie

```
## Scénarios nominaux
- [ ] ...

## Cas limites
- [ ] ...

## Cas d'erreur
- [ ] ...

## Régression
- [ ] ...

## Risques
- P0 : ...
- P1 : ...
- P2 : ...
```

## Comment tester

Exécuter chaque item de la check-list manuellement dans le simulateur iOS ou Android avec un compte de test.
