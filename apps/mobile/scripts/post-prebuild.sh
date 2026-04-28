#!/usr/bin/env bash
set -euo pipefail

WRAPPER="apps/mobile/android/gradle/wrapper/gradle-wrapper.properties"
[[ -d apps/mobile ]] || WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"

if [[ ! -f "$WRAPPER" ]]; then
  echo "❌ $WRAPPER not found — run 'expo prebuild -p android' first." >&2
  exit 1
fi

sed -i.bak -E 's|(distributionUrl=https\\://services\.gradle\.org/distributions/)gradle-[0-9]+\.[0-9]+(\.[0-9]+)?-bin\.zip|\1gradle-8.13-bin.zip|' "$WRAPPER"
rm -f "${WRAPPER}.bak"

if ! grep -q 'gradle-8\.13-bin\.zip' "$WRAPPER"; then
  echo "❌ Failed to pin Gradle 8.13 in $WRAPPER" >&2
  exit 1
fi

echo "✅ Gradle pinned to 8.13"
