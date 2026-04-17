# Keurzen — Claude Code production setup

Setup `.claude/` avec hooks et règles pour ton workflow.
Temps d'installation : **~10 minutes**. ROI : énorme.

---

## 📦 Ce que tu reçois

```
keurzen-setup/
├── CLAUDE.md                        ← à placer à la racine du projet
└── .claude/
    ├── settings.json                ← hooks + permissions
    └── hooks/
        ├── block-dangerous-commands.sh    ← bloque rm -rf, DROP TABLE, etc.
        ├── protect-supabase-migrations.sh ← bloque modif migrations existantes
        ├── auto-format.sh                 ← Prettier auto après chaque edit
        ├── typescript-check.sh            ← tsc + ESLint en arrière-plan
        ├── session-context.sh             ← contexte utile au démarrage
        └── session-summary.sh             ← log fin de session
```

---

## 🚀 Installation (10 min)

### 1. Copier les fichiers

À la racine de ton projet Keurzen (le dossier qui contient `package.json`) :

```bash
# Depuis le dossier keurzen-setup livré :
cp -r .claude /chemin/vers/keurzen/
cp CLAUDE.md /chemin/vers/keurzen/   # ⚠️ Ne pas écraser ton CLAUDE.md actuel sans le sauvegarder
```

### 2. Rendre les hooks exécutables

```bash
cd /chemin/vers/keurzen
chmod +x .claude/hooks/*.sh
```

### 3. Vérifier que `jq` est installé (requis par les hooks)

```bash
jq --version
# Si absent :
brew install jq       # macOS
# ou : sudo apt install jq   # Linux
```

### 4. Ajouter `.claude/logs/` à ton `.gitignore`

```bash
echo ".claude/logs/" >> .gitignore
```

Les hooks écrivent des logs locaux qu'il ne faut pas committer.

### 5. Tester

Ouvre Claude Code dans ton projet :

```bash
cd /chemin/vers/keurzen
claude
```

Tu dois voir le bandeau `═══ KEURZEN — Claude Code session ═══` s'afficher au démarrage. Si oui, tous les hooks sont actifs ✅

---

## 🧪 Tests rapides pour valider chaque hook

**Hook 1 — block-dangerous-commands** (doit échouer) :
> Demande à Claude : "Run `rm -rf /`"
> → Claude doit être bloqué avec 🛑 BLOCKED.

**Hook 2 — protect-supabase-migrations** (doit échouer) :
> "Edit the file `supabase/migrations/0001_initial.sql` and add a column"
> → Claude doit être bloqué (on crée une NOUVELLE migration).

**Hook 3 — auto-format** :
> "Create a test file `test.ts` with unformatted code"
> → Après création, Prettier doit l'avoir reformaté automatiquement.

**Hook 4 — typescript-check** :
> Après n'importe quel edit `.ts`/`.tsx`, regarde `.claude/logs/tsc.log`.
> Tu dois voir les résultats de `tsc --noEmit`.

---

## 🔧 Personnalisation

### Ajouter des patterns dangereux

Édite `.claude/hooks/block-dangerous-commands.sh`, ajoute au tableau `DANGEROUS_PATTERNS`.

### Relâcher les permissions

Dans `settings.json`, déplace une commande de `ask` vers `allow` quand tu es confiant.

### Désactiver temporairement un hook

Commente la section correspondante dans `settings.json` avec `// ...` n'est pas valide JSON — renomme plutôt `settings.json` en `settings.json.off`, teste, puis remets.

---

## 💡 Notes importantes

1. **Les hooks tournent avec tes permissions système.** Ne jamais copier-coller un hook depuis une source non-fiable sans le lire.

2. **Async vs sync** : `typescript-check.sh` et `session-summary.sh` sont `async: true`. Ils ne bloquent pas Claude pendant qu'ils tournent. Les hooks de blocage (`PreToolUse`) sont volontairement synchrones et rapides (timeout 5s).

3. **Les logs dans `.claude/logs/`** ne sont jamais envoyés à Claude. C'est pour toi, pour retrouver des erreurs passées.

4. **Pour aller plus loin** :
   - Sub-agent memory : ajoute `memory: project` à tes agents `architect`/`builder`/`qa` pour qu'ils accumulent des insights
   - Git worktrees : `git worktree add ../keurzen-phase10 phase-10-polish` pour faire tourner une session Claude en parallèle sur la phase 10 sans polluer ta session principale
   - `/model opusplan` : alias qui utilise Opus pour planifier et Sonnet pour exécuter (gros gain sur features complexes)

---

## 🩺 Troubleshooting

**"Hook not firing"**
→ Vérifie `chmod +x .claude/hooks/*.sh`
→ Teste en standalone : `echo '{"tool_input":{"command":"test"}}' | bash .claude/hooks/block-dangerous-commands.sh`

**"Infinite Stop loop"**
→ Ne devrait pas arriver avec ces hooks (aucun exit 2 sur Stop). Si ça arrive, supprime le hook Stop temporairement.

**"Prettier/tsc pas trouvé"**
→ Les hooks utilisent `npx` donc doivent marcher même sans install globale. Si erreur, fais `npm install` à la racine.

---

Bon launch 🚀
