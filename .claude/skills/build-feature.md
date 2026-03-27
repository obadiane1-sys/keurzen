# Build Feature — Keurzen

Lis CLAUDE.md avant de commencer. Lis aussi les fichiers existants concernés avant de modifier quoi que ce soit.

Je veux implémenter la feature suivante : $ARGUMENTS

## Ce que j'attends

1. **Compréhension** — reformuler la demande + fichiers à modifier
2. **Implémentation** — dans l'ordre : types → queries → stores → composants → écrans
3. **Vérification** — lint + tests après chaque fichier modifié
4. **Boucle de vérification finale** (obligatoire)

## Règles d'implémentation

- Lire chaque fichier existant avant de le modifier
- Ne modifier que les fichiers dans le scope déclaré
- Utiliser les tokens du design system — jamais de valeurs hardcodées
- Gérer les états : loading, empty, error
- Types stricts — pas de `any`
- Logique métier dans les hooks/queries, pas dans les écrans

## Ordre standard

```
src/types/index.ts           (si nouveaux types)
src/lib/queries/<module>.ts  (hooks TanStack Query)
src/stores/<store>.ts        (si état global nécessaire)
src/components/ui/           (si nouveau composant partagé)
app/<route>.tsx              (écran final, thin)
```

## Sortie

- Fichiers modifiés (avec diff résumé)
- Commandes lancées + résultats
- Risques / follow-ups

## Comment tester

Donner le scénario exact pas à pas + résultat attendu + edge cases à vérifier.
