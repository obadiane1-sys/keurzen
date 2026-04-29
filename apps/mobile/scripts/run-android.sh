#!/usr/bin/env bash
#
# Wrapper around `expo run:android` that auto-selects OpenJDK 21 when present.
#
# Background: Gradle 8.13 (pinned in apps/mobile/android/gradle/wrapper/
# gradle-wrapper.properties) embeds a Kotlin runtime that cannot parse
# Java 25.x version strings, leading to:
#   java.lang.IllegalArgumentException: 25.0.1
# at JavaVersion.parse, surfaced to the user as the opaque Gradle error
#   "Error resolving plugin [id: 'com.facebook.react.settings'] > 25.0.1".
#
# OpenJDK 25 is the current Homebrew default on Apple Silicon. To avoid
# polluting the user's shell config, we install OpenJDK 21 (LTS) keg-only
# and override JAVA_HOME for this command only.
#
# See apps/mobile/docs/known-issues.md for full context and end-of-workaround
# conditions (Expo SDK 56 + Gradle 9 should remove the need for both pins).
#
set -euo pipefail

JDK_21_PATH="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"

if [ -d "$JDK_21_PATH" ]; then
  export JAVA_HOME="$JDK_21_PATH"
  echo "✅ Using OpenJDK 21 from Homebrew (workaround for Gradle 8.13 + JDK 25)"
else
  echo "⚠️  OpenJDK 21 not found at $JDK_21_PATH"
  echo "   Falling back to system JDK (JAVA_HOME=${JAVA_HOME:-<unset>})"
  echo "   If build fails with 'IllegalArgumentException: 25.0.1', run:"
  echo "   brew install openjdk@21"
fi

exec npx expo run:android "$@"
