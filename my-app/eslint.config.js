// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "dist-web/**",
      // Generated artifacts (Kotlin/JS bundle, derived renderer/piece paths) — not hand-written.
      "src/generated/**",
      "src/components/chess/three-renderer/**",
      "src/components/chess/piece-paths.generated.ts",
    ],
  }
]);
