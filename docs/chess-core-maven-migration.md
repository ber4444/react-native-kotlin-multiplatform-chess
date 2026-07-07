# Plan: Migrate the RN app from vendored chess-core source to the published Maven artifact

## Status

- ✅ **`io.github.ber4444:chess-core:0.2.0` is published** to GitHub Packages (tag
  `chess-core-v0.2.0`, publish workflow run `28882259838`, succeeded 2026-07-07 16:35 UTC).
  Includes the `api`/`implementation` boundary (`kotlinx-coroutines-core` → `api`; ~30 symbols →
  `internal`).
- 🚧 This document covers the second half: making `ber4444/react-native-kotlin-multiplatform-chess`
  consume that artifact instead of its vendored source copy.

## Current RN state (verified)

- **Two independent Gradle roots**, no `include(":chess-core")` at repo root:
  - `chess-core/` — standalone single-target `js(IR)` library build, `rootProject.name = "chess-core"`.
  - `my-app/android/` — Expo-generated RN Android build; never sees chess-core as a Gradle dep.
- **`ChessSession.kt` + `JsChessEngineAdapter.kt`** are RN-only files (NOT in upstream chess-core).
  They are the entire `@JsExport` JS interop surface.
- The vendored `chess-core/src/commonMain/` has **27 .kt files**; ~25 are verbatim/stale copies of
  upstream symbols, 2 are RN-only (`ChessSession.kt`, `JsChessEngineAdapter.kt`).
- **`ChessSession.kt` only references symbols that are PUBLIC in 0.2.0** — verified by diffing its
  calls against `GameViewModel`'s public members in upstream HEAD. Notably `getLegalMovesForPiece`
  (`Move.kt:316`) is public (the earlier agent report that flagged it as a blocker was wrong). So
  the facade compiles unmodified against the published klib.
- The JS bundle pipeline: `npm run build:core` → `./gradlew copyJsToApp` → copies
  `chess-core/build/dist/js/productionLibrary` → `my-app/src/generated/chess-core/` (gitignored,
  passed as a CI artifact). The TS gateway `my-app/src/chess-core/index.ts` imports
  `@/generated/chess-core/chess-core.js`.
- **No GitHub Packages auth exists anywhere** in the RN repo. No `gpr.user`/`gpr.key`, no
  `GITHUB_ACTOR`/`GITHUB_TOKEN`, no Maven repo declaration pointing at `maven.pkg.github.com`.
- RN repo default branch `main` is at `ed17b40`. Current checkout is on `codex/update-node24-actions`
  (1 commit ahead); migration should branch from `main`.

## Migration design

The RN `chess-core/` module becomes a **thin Kotlin/JS bindings library**: it keeps only the two
RN-specific facade files and depends on the published klib for all chess logic.

```
Before:                              After:
chess-core/                          chess-core/   (thin bindings module)
├── src/commonMain/                  ├── build.gradle.kts       (dep: io.github.ber4444:chess-core:0.2.0)
│   ├── (25 vendored copies)         ├── settings.gradle.kts    (+ GitHub Packages repo + auth)
│   ├── ChessSession.kt     ───────► ├── src/commonMain/
│   └── JsChessEngineAdapter.kt ────►│   ├── ChessSession.kt          (kept, unmodified)
│   └── ...                          │   └── JsChessEngineAdapter.kt  (kept, unmodified)
└── build.gradle.kts (source build)  └── (25 vendored files DELETED)
```

The published `js(IR)` variant of `chess-core:0.2.0` is a klib — Kotlin/JS consumes it as a
regular dependency. `copyJsToApp` still produces `chess-core.js` from the bindings module's
`binaries.library()`; the klib's code is linked in. `index.ts`'s import path is unchanged.

## Steps

### 1. Branch from main in the RN repo
```bash
cd /Users/presence/AndroidStudioProjects/reactnative
git checkout main && git checkout -b chore/consume-chess-core-0.2.0
```

### 2. Delete the 25 vendored source files
Remove every `.kt` under `chess-core/src/commonMain/` **except** `ChessSession.kt` and
`JsChessEngineAdapter.kt`. Concretely delete:
- Top-level: `ChessEngine.kt`, `DrawAgreement.kt`, `DrawConditions.kt`, `FenConverter.kt`,
  `GameUiState.kt`, `GameViewModel.kt`, `Move.kt`, `Piece.kt`, `PieceAnimationState.kt`,
  `PromotionType.kt`, `UciEvaluation.kt`, `UciMoveConverter.kt`, `UciProtocolClient.kt`,
  `UciTransport.kt`
- `board3d/`: the entire directory (`Board3DAnimationDriver.kt`, `Board3DInput.kt`,
  `Board3DMoveAnimator.kt`, `Board3DScene.kt`, `Board3DSceneDiffer.kt`, `Board3DSceneMapper.kt`,
  `BoardGeometry.kt`, `ChessSetMeshNames.kt`, `Math3D.kt`, `VisualBaselineScenes.kt`)

Keep: `ChessSession.kt`, `JsChessEngineAdapter.kt`.

### 3. Delete the stale vendored tests
`chess-core/src/commonTest/` tested the vendored logic copies. Those tests now live upstream (and
run in upstream CI). Delete the entire `chess-core/src/commonTest/` directory. (ChessSession itself
has no unit tests today — it's exercised via the RN app's typecheck/build.)

### 4. Rewrite `chess-core/build.gradle.kts`
Replace the source-build config with a thin bindings module:
```kotlin
plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

kotlin {
    js(IR) {
        nodejs()
        binaries.library()
    }

    sourceSets {
        commonMain.dependencies {
            // The published chess engine core. All game rules, converters, GameViewModel,
            // and 3D-board math live here; this module only adds the @JsExport JS facade.
            implementation("io.github.ber4444:chess-core:0.2.0")
        }
    }
}

val copyJsToApp by tasks.registering(Copy::class) {
    description = "Copies the production JS library into ../my-app/src/generated/chess-core for Metro."
    group = "build"
    from(layout.buildDirectory.dir("dist/js/productionLibrary"))
    into(rootProject.projectDir.resolve("../my-app/src/generated/chess-core"))
    dependsOn("jsNodeProductionLibraryDistribution")
}
```
Notes:
- Drop the explicit `kotlinx-coroutines-core` / `kermit` deps — they come transitively from the
  published artifact (coroutines as `api`, so it's on the compile classpath; kermit as
  `implementation`, linked into the JS bundle at build time).
- `commonTest.dependencies` block removed (tests deleted). If we keep a minimal test target, add
  `commonTest.dependencies { implementation(kotlin("test")) }` back.

### 5. Add the GitHub Packages repo + auth to `chess-core/settings.gradle.kts`
```kotlin
dependencyResolutionManagement {
    repositories {
        mavenCentral()
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/ber4444/compose-multiplatform-chess")
            credentials {
                username = System.getenv("GITHUB_ACTOR") ?: providers.gradleProperty("gpr.user").orNull
                password = System.getenv("GITHUB_TOKEN") ?: providers.gradleProperty("gpr.key").orNull
            }
        }
    }
}
```
Local dev: set `gpr.user` / `gpr.key` in `~/.gradle/gradle.properties` (a GitHub username + a PAT
with `read:packages`). CI: export `GITHUB_ACTOR`/`GITHUB_TOKEN` in the workflow (step 8).

### 6. Add the GitHub Packages auth to CI (`.github/workflows/ci.yml`)
In the `chess-core` job, before the Gradle build, export the auto-provided `GITHUB_TOKEN`:
```yaml
      - name: Build Kotlin/JS + run commonTest
        working-directory: chess-core
        env:
          GITHUB_ACTOR: ${{ github.actor }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: ./gradlew jsNodeTest copyJsToApp --no-daemon
```
`secrets.GITHUB_TOKEN` is auto-provided by Actions and has `packages: read` for public-ish package
reads within the same org/user. **If read fails with 403** (GitHub Packages is sometimes stricter
about the auto-token), add a PAT secret `PACKAGES_READ_TOKEN` (scope `read:packages`) and use that
as `GITHUB_TOKEN`.

### 7. Build locally and verify
```bash
cd /Users/presence/AndroidStudioProjects/reactnative/chess-core
GITHUB_ACTOR=<user> GITHUB_TOKEN=<pat> ./gradlew copyJsToApp
```
Expected: resolves `io.github.ber4444:chess-core:0.2.0` from GitHub Packages, links the klib,
produces `build/dist/js/productionLibrary/chess-core.js`. If any `ChessSession.kt` reference
doesn't resolve against 0.2.0 (it should — verified by API diff), the compiler will name the
symbol; fix and rebuild.

Then verify the RN app typechecks and bundles:
```bash
cd ../my-app
npm run typecheck
npm run build:web   # or the dev server
```

### 8. Commit + push + open PR
- Commit message: `chore: consume published io.github.ber4444:chess-core:0.2.0 (drop vendored source)`
- PR description: notes the vendored → Maven switch, the `0.2.0` breaking-change context (none of
  the internalized symbols were used by the facade), and the local-dev auth requirement
  (`gpr.user`/`gpr.key` in `~/.gradle/gradle.properties`).

## Risk / rollback

- **Low compile risk** — verified that every `ChessSession.kt` call site resolves against 0.2.0's
  public API. The behavior also matches: 0.2.0's only changes vs the vendored snapshot are
  additive (PGN/SAN/snapshot/difficulty landed upstream after the snapshot) plus the boundary
  `internal` change (which doesn't affect the facade).
- **Auth is the main operational risk** — GitHub Packages read auth can be finicky. If the CI
  `GITHUB_TOKEN` gets a 403, fall back to a PAT secret. Local dev needs `~/.gradle/gradle.properties`.
- **Rollback** — revert the PR; the vendored source copy is still in git history.

## What this achieves

- **Zero Kotlin duplication** (the original AGENTS.md goal): the RN app compiles against the exact
  artifact this repo publishes. Future chess-logic fixes ship by tagging `chess-core-v0.x.0` and
  bumping one version string.
- The vendored 25-file copy (which had drifted: `GameViewModel` 529→614, missing `EngineDifficulty`,
  `Pgn`, `SanConverter`, `GameSnapshot`) is gone.
- The new `internal` boundary is meaningful for this consumer for the first time — the facade
  physically cannot reach into `getAllLegalMoves`/`pickMoveStockfish`/etc.
