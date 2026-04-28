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
