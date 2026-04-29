# Maestro E2E Tests — Keurzen

Tests end-to-end automatisés de l'app mobile Keurzen avec [Maestro](https://maestro.dev), validés sur **iOS et Android**.

## Pourquoi Maestro

Maestro pilote l'app comme un robot utilisateur : il tape sur les boutons, remplit les champs, vérifie ce qui s'affiche. Les tests sont écrits en YAML déclaratif, lisibles par n'importe qui.

Pour Keurzen, Maestro sert de **filet de sécurité pré-launch** : avant chaque release, on lance la suite et on sait en 1 minute si les flows critiques marchent encore — sur iOS et Android.

## Prérequis communs

- macOS
- Maestro CLI : `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Bundle ID Keurzen : `app.keurzen.mobile` (identique iOS et Android)

## Setup iOS

### Prérequis

- Xcode complet (App Store, pas seulement Command Line Tools)
- Simulateur iOS (testé sur iPhone 17 Pro, iOS 26.4)

### Premier setup

```bash
cd apps/mobile/ios
pod install
cd ..
open ios/Keurzen.xcworkspace
```

Dans Xcode : sélectionner le simulateur "iPhone 17 Pro", puis bouton ▶️ Play.

Attendre que l'app s'ouvre sur le simulateur (3-5 min la première fois). Une fois "Bon retour !" visible, on peut tester.

⚠️ **Ne pas utiliser `npx expo run:ios`** : un bug d'Expo CLI affiche "No code signing certificates" même sur simulateur. Builder via Xcode est plus fiable.

## Setup Android

### Prérequis

- Android Studio installé
- SDK dans `~/Library/Android/sdk`
- AVD `Keurzen_Test` (Pixel 9 Pro, API 37, arm64-v8a)
- PATH configuré dans `~/.zshrc` :
  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$PATH:$ANDROID_HOME/emulator"
  export PATH="$PATH:$ANDROID_HOME/platform-tools"
  export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
  ```

### Premier setup

```bash
# 1. Démarrer l'émulateur
nohup emulator @Keurzen_Test -no-snapshot-load > /tmp/emulator.log 2>&1 &
adb wait-for-device
adb shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 2; done'

# 2. Vérifier
adb devices  # doit afficher emulator-5554 device

# 3. Builder Keurzen
cd apps/mobile
npm run android  # 5-15 min première fois
```

⚠️ **NE JAMAIS utiliser `npx expo run:android` directement** sur Android. À la place, toujours `npm run android` — le wrapper `scripts/run-android.sh` overrides `JAVA_HOME` vers OpenJDK 21 pour contourner l'incompatibilité Gradle 8.13 / JDK 25. Voir [`docs/known-issues.md`](../docs/known-issues.md) section "JDK 25 incompatible avec Gradle 8.13".

⚠️ **NE JAMAIS utiliser `expo prebuild` directement** sur Android. À la place :

```bash
npm run prebuild:android  # inclut le pin Gradle 8.13
```

Voir [`docs/known-issues.md`](../docs/known-issues.md) pour le contexte du bug Gradle 9.

### Cold start après reboot

Si tu reboot l'émulateur ou redémarres ton Mac, le dev-launcher Expo n'auto-charge pas le bundle Metro. Workaround :

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "exp+keurzen://expo-development-client/?url=http%3A%2F%2F$(ifconfig en0 | awk '/inet /{print $2}')%3A8081"
```

Une fois le bundle chargé une fois, Maestro peut prendre le relais.

## Lancer les tests

### Toute la suite

```bash
cd apps/mobile
maestro test .maestro/
```

Durée : ~1 min iOS, ~2 min Android (premier run plus lent).

### Un flow spécifique

```bash
maestro test .maestro/02-login-unknown-email.yaml
```

### Choix de la plateforme cible

Maestro détecte automatiquement le device disponible :
- Si seul un simulateur iOS est lancé → tests sur iOS
- Si seul un émulateur Android est lancé → tests sur Android
- Si les deux sont lancés → utilise le premier détecté (forcer avec `--device`)

```bash
# Forcer iOS
maestro test --device "iPhone 17 Pro" .maestro/

# Forcer Android
maestro test --device "Keurzen_Test" .maestro/
```

### Debug visuel avec Maestro Studio

```bash
maestro studio
```

Ouvre une interface web (`http://localhost:9999`) qui montre l'arbre d'éléments de l'écran courant et génère automatiquement le YAML pour les actions cliquées. Indispensable pour identifier les bons sélecteurs.

## Flows actuels

| Fichier | Ce qu'il teste | Couvre | iOS | Android |
|---|---|---|---|---|
| `01-app-launches.yaml` | L'app se lance et affiche l'écran login | Smoke test | ✅ | ✅ |
| `02-login-unknown-email.yaml` | Email inconnu → message "Aucun compte trouvé" | Cas erreur signup | ✅ | ✅ |
| `03-invitation-code-invalid.yaml` | Code 6 chiffres invalide → reste sur l'écran | Cas erreur invitation | ✅ | ✅ |
| `04-invitation-code-partial.yaml` | Code partiel → bouton désactivé, pas de validation | Validation UI invitation | ✅ | ✅ |

### Ce qui n'est PAS couvert (volontairement)

- **Login OTP complet** : nécessite un mailbox de test automatisé ou un bypass dev-only. Reporté post-launch.
- **Code d'invitation valide** : nécessite une infrastructure de test isolée (création de user via Edge Function, reset state). Le happy path est validé manuellement à chaque release.
- **Création de compte complète** : même problématique OTP.

## Conventions d'écriture

### Nommage

`NN-feature-scenario.yaml` — exemple : `04-invitation-code-partial.yaml`

Le préfixe numérique force un ordre d'exécution déterministe (Maestro lance les fichiers d'un dossier dans l'ordre alphabétique).

### Structure d'un flow

```yaml
appId: app.keurzen.mobile
---
- launchApp

# Étape 1 : assertion d'état initial avec timeout (cold start Android)
- extendedWaitUntil:
    visible: "Bon retour !"
    timeout: 30000

# Étape 2 : navigation
- tapOn: ".*invitation.*"

# Étape 3 : interaction
- tapOn:
    below: ".*6 chiffres.*"
- inputText: "999999"

# Étape 4 : validation finale
- extendedWaitUntil:
    visible: "..."
    timeout: 10000
```

Les commentaires `#` documentent le QUOI (cas testé), pas le COMMENT (le YAML lui-même).

### Sélecteurs — Du plus stable au moins stable

1. **`testID`** (excellent, à privilégier) — nécessite ajout côté code RN
2. **`accessibilityLabel`** (très bon)
3. **Texte visible permanent** (acceptable) — `tapOn: "Continuer"`
4. **Regex partielle** (robuste aux changements de wording) — `tapOn: ".*invitation.*"`
5. **Placeholder** (fragile, casse dès qu'on saisit) — éviter sauf nécessité
6. **Coordonnées** (à fuir) — `point: "54%,54%"`

Pour cibler un TextInput : **toujours utiliser le placeholder ou le testID, jamais le label** au-dessus du champ. Sur React Native, taper sur le label ne donne pas le focus au champ.

### Apostrophes et caractères spéciaux

L'app utilise des apostrophes typographiques. Le YAML est tapé avec des apostrophes droites. Maestro fait la différence.

Solution : utiliser une regex partielle qui évite l'apostrophe.

```yaml
# Fragile
- tapOn: "J'ai un code d'invitation"

# Robuste
- tapOn: ".*invitation.*"
```

### Délais réseau et cold start

Toujours utiliser `extendedWaitUntil` (pas `assertVisible`) pour :
- Les éléments qui apparaissent après un appel backend
- La première assertion d'un flow (cold start Android peut prendre 10-30s)

```yaml
- extendedWaitUntil:
    visible: "Bon retour !"
    timeout: 30000
```

## Pièges connus

### iOS — `clearState: true` casse les Development Builds Expo

Avec `clearState: true`, Maestro vide tout le storage de l'app, y compris la mémoire du serveur Metro. La Dev Build Expo affiche alors son launcher de sélection de serveur au lieu de Keurzen.

**Solution** : ne pas utiliser `clearState: true`. Si on a besoin d'un état "déconnecté", déclencher un logout via l'UI dans le flow.

À terme : passer sur un Preview Build EAS (`eas build --profile preview --local`) qui charge le JS bundle depuis le binaire et supporte `clearState`.

### iOS — Expo CLI signing error sur simulateur

`npx expo run:ios` peut afficher "No code signing certificates are available" même sur simulateur, à cause d'un bug d'Expo CLI.

**Solution** : ouvrir le `.xcworkspace` dans Xcode et builder via le bouton ▶️ Play. Plus fiable qu'Expo CLI.

### Android — Bundle Metro pas auto-chargé après reboot

Après un reboot d'émulateur ou de Mac, le dev-launcher Expo Android n'auto-charge pas le bundle Metro et reste bloqué sur sa page d'accueil.

**Solution** : re-deeplinker une fois manuellement (cf. section "Setup Android > Cold start après reboot"), puis Maestro peut reprendre.

### Android — Gradle 9.0.0 plante avec foojay-resolver

Sur Apple Silicon, Gradle 9.0.0 + foojay-resolver-convention plante avec `JvmVendorSpec.IBM_SEMERU`. Bug connu d'Expo SDK 55.

**Solution** : pin Gradle 8.13 via `npm run prebuild:android` (inclut un script post-prebuild). Voir [`docs/known-issues.md`](../docs/known-issues.md).

**Fin du contournement** : à la sortie d'Expo SDK 56 (estimé fin mai 2026), retester sans le pin. Un agent Claude Code scheduled vérifie automatiquement.

### Hoisting Reanimated/Worklets en monorepo

Si `pod install` échoue avec "Failed to validate worklets version", c'est que `react-native-worklets` n'est pas hoisté à la racine du workspace.

**Fix** :

```bash
cd ~/Keurzen
yarn add -W react-native-worklets@<version-matching-reanimated>
```

## Workflow type pour ajouter un nouveau flow

1. **Test manuel d'abord** : faire le scénario à la main sur le simulateur, noter quel écran apparaît à chaque étape
2. **Lancer Maestro Studio** : `maestro studio` pour identifier les sélecteurs exacts
3. **Créer le YAML** : `cat > .maestro/NN-mon-flow.yaml << 'EOF' ... EOF`
4. **Tester en isolation iOS** : `maestro test .maestro/NN-mon-flow.yaml`
5. **Itérer sur les sélecteurs** jusqu'à ce que ça passe
6. **Tester sur Android** : démarrer l'émulateur et relancer le flow
7. **Lancer la suite complète** : `maestro test .maestro/` pour vérifier la non-régression
8. **Commit** avec un message clair : `test(maestro): add <feature> <scenario> flow`

## Debug — Quand un test échoue

Maestro génère des artefacts de debug à chaque échec :

```bash
ls ~/.maestro/tests/
```

Le dossier le plus récent (timestamp) contient :
- `screenshot-*.png` : ce que voyait Maestro au moment de l'échec
- `view-hierarchy-*.json` : l'arbre d'éléments de l'écran (utile pour identifier les vrais textes/IDs)
- `commands-*.json` : la liste des actions tentées et leur résultat

```bash
# Ouvrir le dernier dossier de debug
open ~/.maestro/tests/$(ls -t ~/.maestro/tests/ | head -1)/
```

## Roadmap

### Done

- [x] Script `pre-launch-check.sh` qui chaîne ESLint + TS strict + Maestro (cf. `scripts/pre-launch-check.sh` à la racine du repo)

### Avant launch (P0)

- [ ] Helpers réutilisables (`helpers/goto-login.yaml`, `helpers/goto-invitation.yaml`)

### Post-launch (P1)

- [ ] Compte E2E dédié avec bypass OTP via Edge Function
- [ ] Branche Supabase isolée pour les tests (reset entre runs)
- [ ] Maestro Cloud pour CI automatique sur GitHub Actions
- [ ] Flow happy path complet : login → dashboard → créer tâche → compléter → mental load
- [ ] Build release-debug Android avec bundle JS embarqué (élimine la dépendance Metro)
- [ ] Tests Web app via Playwright (Maestro est mobile-only)
- [ ] Vérifier compatibilité Expo SDK 56 + Gradle 9 (agent scheduled)

## Ressources

- [Documentation Maestro](https://docs.maestro.dev)
- [Référence des commandes YAML](https://docs.maestro.dev/api-reference/commands)
- [Selectors guide](https://docs.maestro.dev/api-reference/selectors)
- [Known issues du projet](../docs/known-issues.md)
