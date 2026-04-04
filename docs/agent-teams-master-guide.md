# Agent Teams - Guide de Reference Master

> Source officielle : https://code.claude.com/docs/fr/agent-teams
> Derniere mise a jour : 2026-04-02

Ce guide est une reference interne pour construire et orchestrer des equipes d'agents Claude Code efficaces sur le projet Keurzen.

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Activation](#2-activation)
3. [Architecture](#3-architecture)
4. [Subagents vs Agent Teams](#4-subagents-vs-agent-teams)
5. [Demarrer une equipe](#5-demarrer-une-equipe)
6. [Modes d'affichage](#6-modes-daffichage)
7. [Controle de l'equipe](#7-controle-de-lequipe)
8. [Communication inter-agents](#8-communication-inter-agents)
9. [Gestion des taches](#9-gestion-des-taches)
10. [Hooks de qualite](#10-hooks-de-qualite)
11. [Patterns d'orchestration](#11-patterns-dorchestration)
12. [Bonnes pratiques](#12-bonnes-pratiques)
13. [Anti-patterns](#13-anti-patterns)
14. [Troubleshooting](#14-troubleshooting)
15. [Limitations connues](#15-limitations-connues)
16. [Exemples Keurzen](#16-exemples-keurzen)

---

## 1. Vue d'ensemble

Les equipes d'agents permettent de coordonner **plusieurs instances Claude Code** travaillant ensemble. Une session agit comme **chef d'equipe** (lead), coordonnant le travail, assignant des taches et synthetisant les resultats. Les coequipiers (teammates) travaillent independamment, chacun dans sa propre fenetre de contexte, et communiquent directement les uns avec les autres.

Contrairement aux subagents (qui s'executent au sein d'une seule session et ne peuvent que rendre compte a l'agent principal), les coequipiers peuvent :
- Se parler directement entre eux
- Partager une liste de taches
- Revendiquer du travail de maniere autonome
- Etre contactes directement par l'utilisateur

**Requires** : Claude Code v2.1.32+

---

## 2. Activation

Deja configure dans ce projet via `.claude/settings.json` :

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## 3. Architecture

Une equipe se compose de 4 elements :

| Composant          | Role                                                                 |
|--------------------|----------------------------------------------------------------------|
| **Chef d'equipe**  | Session principale qui cree l'equipe, genere les coequipiers, coordonne |
| **Coequipiers**    | Instances Claude Code distinctes, chacune avec sa fenetre de contexte  |
| **Liste de taches**| Liste partagee d'elements de travail (pending/in-progress/completed)   |
| **Boite aux lettres** | Systeme de messagerie pour la communication inter-agents            |

### Stockage local

```
~/.claude/teams/{team-name}/config.json    # Configuration d'equipe (auto-generee)
~/.claude/tasks/{team-name}/               # Liste de taches partagee
```

> **Ne pas editer `config.json` manuellement** : il est ecrase a chaque mise a jour d'etat.

### Ce que chaque coequipier recoit automatiquement

- CLAUDE.md du projet
- MCP servers configures
- Skills disponibles
- Le prompt de generation du chef
- **PAS** l'historique de conversation du chef

---

## 4. Subagents vs Agent Teams

|                     | Subagents                                    | Agent Teams                                   |
|---------------------|----------------------------------------------|-----------------------------------------------|
| **Contexte**        | Fenetre propre, resultats reviennent au parent | Fenetre propre, completement independant       |
| **Communication**   | Rend compte uniquement a l'agent principal    | Les coequipiers se messagent directement       |
| **Coordination**    | L'agent principal gere tout                   | Liste de taches partagee + auto-coordination   |
| **Meilleur pour**   | Taches ciblees, resultat seul compte          | Travail complexe necessitant discussion        |
| **Cout en tokens**  | Inferieur (resultats resumes)                 | Superieur (chaque coequipier = instance Claude)|
| **Interaction user**| Impossible directement                        | User peut parler a chaque coequipier           |

### Regle de choix

- **Subagent** : tache isolee, pas besoin de communication entre workers (recherche, lint, test)
- **Agent Team** : travail necessitant coordination, debat, ou partage de conclusions entre workers

---

## 5. Demarrer une equipe

### Methode 1 : Demander explicitement

```
Cree une equipe d'agents pour [decrire la tache].
Genere [N] coequipiers :
- Un pour [role 1]
- Un pour [role 2]
- Un pour [role 3]
```

### Methode 2 : Claude propose

Si Claude determine que la tache beneficierait du travail parallele, il peut suggerer de creer une equipe. L'utilisateur confirme avant la creation.

### Specifier un modele par coequipier

```
Cree une equipe avec 4 coequipiers. Utilise Sonnet pour chaque coequipier.
```

### Utiliser une definition de subagent existante

Les coequipiers peuvent heriter du prompt, des outils et du modele d'un subagent defini dans `.claude/agents/` :

```
Genere un coequipier utilisant le type d'agent code-reviewer pour auditer le module auth.
```

Cela permet de definir un role une fois et de le reutiliser comme subagent ET comme coequipier.

---

## 6. Modes d'affichage

| Mode            | Description                                         | Prerequis       |
|-----------------|-----------------------------------------------------|-----------------|
| **in-process**  | Tous dans le terminal principal. Shift+Down pour naviguer | Aucun           |
| **split-panes** | Chaque coequipier dans son propre volet               | tmux ou iTerm2  |
| **auto**        | Split si deja dans tmux, sinon in-process (defaut)    | -               |

### Configurer

```json
// ~/.claude.json (config globale)
{ "teammateMode": "in-process" }
```

Ou pour une session :

```bash
claude --teammate-mode in-process
```

### Navigation en mode in-process

| Action                    | Raccourci       |
|---------------------------|-----------------|
| Parcourir les coequipiers | Shift+Down      |
| Revenir au chef           | Shift+Down (apres le dernier coequipier) |
| Voir session coequipier   | Enter           |
| Interrompre coequipier    | Escape          |
| Toggle liste de taches    | Ctrl+T          |

---

## 7. Controle de l'equipe

### Parler directement a un coequipier

- **In-process** : Shift+Down pour naviguer, puis taper
- **Split-panes** : Cliquer dans le volet

### Exiger l'approbation du plan

Pour les taches complexes ou risquees :

```
Genere un coequipier architecte pour refactoriser le module auth.
Exige l'approbation du plan avant qu'il fasse des modifications.
```

Le coequipier travaille en mode plan (lecture seule) jusqu'a approbation du chef.
Le chef approuve ou rejette avec des commentaires.
En cas de rejet, le coequipier revise et resoumit.

### Influencer les criteres d'approbation

```
N'approuve que les plans qui incluent la couverture de test.
Rejette les plans qui modifient le schema de base de donnees.
```

### Arreter un coequipier

```
Demande au coequipier chercheur de s'arreter.
```

Le coequipier peut approuver (arret gracieux) ou rejeter avec explication.

### Nettoyer l'equipe

```
Nettoie l'equipe.
```

> **Toujours utiliser le chef pour nettoyer.** Les coequipiers ne doivent pas executer le nettoyage.
> Le chef verifie les coequipiers actifs et echoue s'il y en a encore en cours. Arretez-les d'abord.

---

## 8. Communication inter-agents

### Types de messages

| Type        | Description                              | Usage                    |
|-------------|------------------------------------------|--------------------------|
| **message** | Envoyer a un coequipier specifique       | Communication ciblee     |
| **broadcast** | Envoyer a tous les coequipiers         | A utiliser avec parcimonie (cout x N) |

### Livraison

- **Automatique** : les messages des coequipiers arrivent au chef sans polling
- **Notifications d'inactivite** : quand un coequipier termine, il notifie le chef
- **Liste de taches partagee** : tous les agents voient l'etat des taches en temps reel

### Decouverte d'equipe

Les coequipiers peuvent lire `~/.claude/teams/{team-name}/config.json` pour decouvrir les autres membres (tableau `members` avec nom, ID d'agent et type).

---

## 9. Gestion des taches

### Etats

```
pending --> in-progress --> completed
```

Les taches peuvent avoir des **dependances** : une tache pending avec des dependances non resolues ne peut pas etre revendiquee.

### Modes d'assignation

| Mode              | Description                                                |
|-------------------|------------------------------------------------------------|
| **Chef assigne**  | Dire au chef quelle tache donner a quel coequipier        |
| **Auto-revendication** | Apres avoir termine, un coequipier prend la prochaine tache libre |

La revendication utilise le **verrouillage de fichiers** pour eviter les race conditions.

### Deblocage automatique

Quand un coequipier complete une tache dont d'autres dependent, les taches bloquees se debloquent sans intervention manuelle.

---

## 10. Hooks de qualite

Utilisez les hooks pour appliquer des regles automatiques :

| Hook             | Declencheur                              | Exit code 2 = |
|------------------|------------------------------------------|----------------|
| `TeammateIdle`   | Coequipier sur le point de devenir inactif | Feedback + continuer |
| `TaskCreated`    | Tache en cours de creation               | Empecher creation + feedback |
| `TaskCompleted`  | Tache marquee complete                   | Empecher completion + feedback |

### Exemple : Empecher completion sans tests

```json
{
  "hooks": {
    "TaskCompleted": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "echo 'Verifiez que les tests passent avant de marquer comme complete'",
        "timeout": 30
      }]
    }]
  }
}
```

---

## 11. Patterns d'orchestration

### Pattern 1 : Revue parallele multi-angles

Chaque coequipier examine le meme code avec un filtre different. Le chef synthetise.

```
Cree une equipe d'agents pour examiner la PR #142. Genere trois examinateurs :
- Un axe sur les implications de securite
- Un verifiant l'impact sur les performances
- Un validant la couverture de test
Demande-leur d'examiner et de signaler les conclusions.
```

### Pattern 2 : Hypotheses concurrentes (debat)

Les coequipiers explorent des theories differentes ET se contestent mutuellement.

```
Les utilisateurs signalent [bug]. Genere 5 coequipiers pour enqueter sur differentes
hypotheses. Demande-leur de se parler pour essayer de refuter les theories les uns
des autres, comme un debat scientifique. Mets a jour le document des conclusions
avec le consensus qui emerge.
```

### Pattern 3 : Implementation modulaire

Chaque coequipier possede un module distinct. Zero chevauchement de fichiers.

```
Cree une equipe pour implementer la feature X :
- Coequipier 1 : module backend (src/lib/, supabase/)
- Coequipier 2 : module UI (src/components/)
- Coequipier 3 : ecrans et navigation (app/)
- Coequipier 4 : tests (src/__tests__/)
Chacun possede ses fichiers exclusivement. Pas de chevauchement.
```

### Pattern 4 : Recherche + Implementation

Phase 1 : equipe de recherche explore. Phase 2 : equipe d'implementation execute.

```
Phase 1 : Genere 3 coequipiers chercheurs pour explorer :
- L'API de [service X]
- Les contraintes de performance
- Les patterns existants dans la codebase

Attendez les conclusions puis genere une equipe d'implementation basee sur les resultats.
```

### Pattern 5 : Approbation de plan requise

Pour les taches a haut risque, exiger validation avant implementation.

```
Genere un coequipier architecte pour refactoriser le module auth.
Exige l'approbation du plan avant qu'il fasse des modifications.
N'approuve que les plans qui :
- Incluent des tests
- Ne cassent pas les endpoints existants
- Documentent les changements de schema
```

---

## 12. Bonnes pratiques

### Taille d'equipe

- **3 a 5 coequipiers** pour la plupart des cas
- **5 a 6 taches par coequipier** pour la productivite optimale
- 15 taches independantes -> 3 coequipiers est un bon point de depart
- 3 coequipiers cibles > 5 coequipiers disperses

### Contexte suffisant

Les coequipiers ne recoivent PAS l'historique de conversation. Inclure les details dans le prompt de generation :

```
Genere un coequipier securite avec le prompt : "Examine le module auth a src/auth/
pour les vulnerabilites. Focus sur la gestion des tokens, sessions et validation
des entrees. L'app utilise des JWT en cookies httpOnly. Signale avec severite."
```

### Dimensionnement des taches

| Taille    | Probleme                                          |
|-----------|---------------------------------------------------|
| Trop petit | Surcharge de coordination > benefice              |
| Trop grand | Trop longtemps sans checkpoint, risque de gaspillage |
| Correct    | Unite autonome avec livrable clair (fonction, fichier test, review) |

### Attendre les coequipiers

Si le chef commence a implementer au lieu de deleguer :

```
Attends que tes coequipiers completent leurs taches avant de proceder.
```

### Eviter les conflits de fichiers

**Regle d'or** : chaque coequipier possede un ensemble de fichiers different. Deux coequipiers editant le meme fichier = ecrasements.

### Superviser activement

Verifier la progression, rediriger si necessaire, synthetiser au fur et a mesure. Ne pas laisser une equipe tourner sans surveillance trop longtemps.

---

## 13. Anti-patterns

| Anti-pattern | Pourquoi c'est mauvais | Alternative |
|---|---|---|
| Equipe pour tache sequentielle | Surcharge de coordination inutile | Session unique ou subagents |
| Coequipiers editant les memes fichiers | Conflits et ecrasements | Decouper par module/fichier |
| Trop de coequipiers (>6) | Couts tokens explosent, rendements decroissants | 3-5 max |
| Broadcast excessif | Cout x N coequipiers | Messages cibles |
| Pas de contexte dans le prompt | Coequipier perdu, mauvais travail | Prompt detaille et specifique |
| Laisser tourner sans surveillance | Gaspillage de tokens, derive | Checkpoints reguliers |
| Coequipier fait le nettoyage | Etat incoherent | Toujours le chef nettoie |
| Equipes imbriquees | Non supporte | Utiliser subagents a l'interieur |

---

## 14. Troubleshooting

### Les coequipiers n'apparaissent pas

- **In-process** : Shift+Down pour verifier s'ils sont deja actifs
- Verifier que la tache est assez complexe pour justifier une equipe
- Verifier tmux installe (`which tmux`) si mode split-panes
- iTerm2 : verifier `it2` CLI + API Python activee

### Trop de demandes de permission

Pre-approuver les operations courantes dans les parametres de permission AVANT de generer les coequipiers.

### Coequipiers qui s'arretent sur erreur

1. Verifier la sortie (Shift+Down ou clic sur volet)
2. Donner des instructions supplementaires directement
3. OU generer un coequipier de remplacement

### Chef s'arrete trop tot

```
Continue. Attends que tous les coequipiers terminent avant de conclure.
```

### Sessions tmux orphelines

```bash
tmux ls
tmux kill-session -t <session-name>
```

---

## 15. Limitations connues

| Limitation | Impact |
|---|---|
| Pas de reprise de session (in-process) | `/resume` et `/rewind` ne restaurent pas les coequipiers. Generer de nouveaux apres reprise. |
| Etat des taches peut etre en retard | Les coequipiers oublient parfois de marquer complete. Verifier et mettre a jour manuellement. |
| Arret peut etre lent | Les coequipiers finissent leur requete en cours avant de s'arreter. |
| Une equipe par session | Nettoyer l'equipe actuelle avant d'en demarrer une nouvelle. |
| Pas d'equipes imbriquees | Seul le chef peut gerer l'equipe. Les coequipiers ne generent pas de sous-equipes. |
| Chef fixe | La session qui cree l'equipe est le chef pour toujours. Pas de promotion possible. |
| Permissions = celles du chef | Tous les coequipiers demarrent avec le meme mode. Modifiable apres generation seulement. |
| Split-panes | Necessite tmux ou iTerm2. Non supporte dans VS Code terminal, Windows Terminal, Ghostty. |

---

## 16. Exemples Keurzen

### Exemple 1 : Feature complete Palier 2

```
Cree une equipe d'agents pour implementer la feature "Types de taches".
Genere 4 coequipiers :

1. **backend** (type: keurzen-backend) : migration SQL, RPC, RLS pour task_types
2. **components** (type: expo-mobile-builder) : composants TaskTypeSelector, TaskTypeBadge
3. **screens** : integration dans app/(app)/tasks/create.tsx et index.tsx
4. **tests** (type: qa-regression) : scenarios de recette, edge cases, regression

Chacun possede ses fichiers exclusivement.
Le coequipier screens attend que backend et components terminent.
Exige l'approbation du plan pour le coequipier backend.
```

### Exemple 2 : Bug investigation

```
Bug : "Edge Function returned a non-2xx status code" sur send-invite-code.
Cree une equipe de 3 enqueteurs :

1. **logs** : inspecter les logs Supabase, tester avec curl, verifier le JWT
2. **client** : examiner le code client (invitation-codes.ts), headers, error handling
3. **infra** : verifier la config deploy, --no-verify-jwt, secrets, redirect URLs

Demande-leur de debattre et de converger vers la cause racine.
```

### Exemple 3 : Code review multi-angles

```
Cree une equipe pour reviewer les changements du systeme d'invitation par code.
Genere 3 reviewers :

1. **securite** (type: code-reviewer) : RLS, auth bypass, SQL injection, rate limiting
2. **ux** (type: design-system-guardian) : coherence tokens, empty states, accessibilite
3. **qa** (type: qa-regression) : couverture de test, edge cases, regression

Synthetise les conclusions en un rapport unique.
```

### Exemple 4 : Recherche avant implementation

```
Avant d'implementer le rebalancing actif des taches (V2), cree une equipe de recherche :

1. **algo** : explorer les algorithmes de repartition equitable (round-robin, charge-based)
2. **ux** : rechercher les patterns UX de suggestion (pas automatique, cf ROADMAP.md)
3. **data** : analyser le schema existant (tasks, time_logs, weekly_stats) pour les donnees disponibles

Attendez les conclusions puis propose un plan d'implementation.
```

---

## Rappels cles

1. **3-5 coequipiers max**, 5-6 taches par coequipier
2. **Zero chevauchement de fichiers** entre coequipiers
3. **Prompt detaille** : les coequipiers n'ont pas l'historique
4. **Utiliser les subagents existants** (`.claude/agents/`) comme types de coequipiers
5. **Superviser** : ne pas laisser tourner sans surveillance
6. **Le chef nettoie** : jamais un coequipier
7. **Commencer par la recherche** si c'est votre premiere equipe
8. **Subagents pour taches isolees**, Agent Teams pour coordination
