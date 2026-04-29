# Known Issues — Keurzen Mobile

## ⚠️ Android : ne JAMAIS faire `expo prebuild` directement

**À la place** :

```bash
cd apps/mobile
npm run prebuild:android
```

**Pourquoi** : Gradle 9.0.0 + foojay-resolver-convention plante avec `JvmVendorSpec.IBM_SEMERU` sur Apple Silicon. Bug connu d'Expo SDK 55. Le script `scripts/post-prebuild.sh` re-pin Gradle à 8.13 après chaque prebuild.

**Symptôme du bug** : Gradle build échoue avec une erreur mentionnant `JvmVendorSpec.IBM_SEMERU` lors du resolve toolchain.

**Fin du contournement** : à la sortie d'Expo SDK 56 (estimé fin mai 2026), re-tester sans le pin. L'agent scheduled vérifiera automatiquement.

## ⚠️ Reanimated/Worklets : maintenir worklets à la racine du workspace

`react-native-reanimated` 4.x a besoin que `react-native-worklets` soit
**hoisté à la racine du monorepo** (`/Keurzen/node_modules/`), pas seulement
dans `apps/mobile/node_modules/`. Sinon `pod install` échoue avec :

```
[!] The following Swift pods cannot yet be integrated as static libraries:
Failed to validate worklets version. The native part of Worklets …
doesn't match the JavaScript part. Please clean build cache and node_modules
and try again.
```

### Symptôme

`pod install` planté juste après un `npm install` ou un `expo prebuild`,
même quand `react-native-worklets` est bien dans `apps/mobile/package.json`.
La cause : npm a remonté le package dans `apps/mobile/node_modules/` au
lieu de `node_modules/` racine, là où Reanimated le cherche.

### Fix permanent (commit `0e8c939`)

Ajouter `react-native-worklets` comme dépendance directe du `package.json`
racine — pas seulement transitivement via `apps/mobile`. Cela force npm à
le hoister et à le garder en place.

```json
// /Keurzen/package.json
"dependencies": {
  "react-native-worklets": "^0.7.2"
}
```

La version doit matcher celle requise par la version de Reanimated
installée (cf. release notes de chaque version mineure de Reanimated 4.x).

### Vérification

```bash
ls ~/Keurzen/node_modules/react-native-worklets/package.json
# doit exister — sinon le hoisting est cassé, relancer npm install
```

## ⚠️ Android : JDK 25 incompatible avec Gradle 8.13

Le JDK par défaut installé par Homebrew sur Apple Silicon en 2026 est OpenJDK 25.
Gradle 8.13 (notre pin pour contourner le bug foojay/IBM_SEMERU de Gradle 9.x)
embarque une version de Kotlin qui ne sait pas parser les versions Java 25.x.

### Symptôme

```
* What went wrong:
Error resolving plugin [id: 'com.facebook.react.settings']
> 25.0.1

BUILD FAILED in 2s
```

Avec `--stacktrace`, la vraie cause apparaît :

```
Caused by: java.lang.IllegalArgumentException: 25.0.1
  at org.jetbrains.kotlin.com.intellij.util.lang.JavaVersion.parse(JavaVersion.java:307)
  at org.jetbrains.kotlin.com.intellij.util.lang.JavaVersion.current(JavaVersion.java:176)
```

### Setup une fois

```bash
brew install openjdk@21
```

`openjdk@21` est **keg-only** : Homebrew ne le symlinke pas dans `/opt/homebrew`,
donc le JDK système (25) reste le défaut. C'est volontaire — on ne pollue ni
le PATH ni le `~/.zshrc`. Le JDK 21 n'est utilisé que quand on l'invoque
explicitement par son chemin complet.

### Comment l'utiliser

Ne JAMAIS lancer `npx expo run:android` directement. À la place :

```bash
cd apps/mobile
npm run android
```

Le script `apps/mobile/scripts/run-android.sh` détecte automatiquement le
JDK 21 à `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`,
exporte `JAVA_HOME` pour la durée du build, et délègue à `expo run:android`.
Si le JDK 21 n'est pas trouvé, le script affiche un warning explicite avec
la commande d'install à lancer.

### Fin du contournement

Disparaîtra avec **Expo SDK 56 + Gradle 9** (estimé fin mai 2026) — l'agent
scheduled qui vérifie le retour à un Gradle moderne testera aussi la
compatibilité Java 25+ à ce moment-là.
