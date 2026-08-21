// chess-core — React Native consumer of the published `io.github.ber4444:chess-core` artifact.
//
// This module is a THIN Kotlin/JS (IR) wrapper: it depends on the chess engine core published from
// `ber4444/compose-multiplatform-chess` (the single source of truth for all rules, converters,
// GameViewModel, and 3D-board math) and adds only the RN-specific JS interop:
//   - ChessSession.kt        — the @JsExport facade the RN app calls (subscribe/select/move/...).
//   - JsChessEngineAdapter.kt — adapts a JS-Promise engine to the core's ChessEngine interface.
//
// No chess logic lives here. The Gradle `copyJsToApp` task drops the compiled JS library + the
// generated TypeScript declarations into ../my-app/src/generated/chess-core for Metro to resolve.
//
// TypeScript declarations: `generateTypeScriptDefinitions()` (KGP, stable since Kotlin 1.8) walks
// every @JsExport declaration in ChessSession.kt and emits a matching `.d.ts` next to the JS
// bundle. The RN app consumes those generated types directly — there is no hand-maintained gateway
// file to keep in sync when the Kotlin API changes.
//
// Auth: GitHub Packages requires a PAT with `read:packages` even for public packages. Provide
// GITHUB_ACTOR + GITHUB_PACKAGES_TOKEN (or GITHUB_TOKEN) in the env, or gpr.user/gpr.key in
// ~/.gradle/gradle.properties. CI injects these via repo secrets.

plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

kotlin {
    js(IR) {
        // nodejs() gives reliable headless testing (no Karma/Chrome dependency) and produces the
        // same Kotlin/JS IR library output that RN consumes on every platform.
        nodejs()
        // Produce an importable JS library (ESM/UMD + package.json) consumed by the RN app.
        binaries.library()
        // Emit TypeScript declarations (.d.ts) from @JsExport declarations in ChessSession.kt so the
        // RN app gets fully-typed bindings straight from the Kotlin source — no hand-written gateway
        // that can drift from the Kotlin API. KGP also validates the generated declarations compile
        // against a pinned TypeScript (added as a devDependency in the generated package.json).
        generateTypeScriptDefinitions()
    }

    sourceSets {
        commonMain.dependencies {
            // The single source of truth for chess logic. Published from compose-multiplatform-chess.
            implementation("io.github.ber4444:chess-core:${property("chessCoreVersion")}")
            // The core exposes kotlinx.coroutines Flow types in its public API (GameViewModel's
            // StateFlows); ChessSession subscribes to them directly, so coroutines is a first-class
            // dependency here, not merely transitive.
            implementation(libs.kotlinx.coroutines.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.kotlinx.coroutines.test)
        }
    }
}

// Force patched transitive deps into the Kotlin/JS test toolchain. The Node test runner KGP
// downloads (mocha) pins versions that Dependabot flags; none of these ship in the RN bundle, they
// only run during jsNodeTest. A Yarn `resolution` pins the whole dependency tree to the patched
// release. Only packages whose advisory fix falls *outside* mocha's declared range need a pin here —
// brace-expansion and js-yaml patch within range, so a plain lock refresh covers those. Run
// `./gradlew kotlinUpgradeYarnLock` after changing this to refresh kotlin-js-store/yarn.lock.
rootProject.plugins.withType<org.jetbrains.kotlin.gradle.targets.js.yarn.YarnPlugin> {
    rootProject.the<org.jetbrains.kotlin.gradle.targets.js.yarn.YarnRootExtension>().apply {
        // mocha pins ^6.0.2. Code injection via RegExp.flags / Date.toISOString
        // (GHSA-5c6j-r48x-rmvq, fixed in 7.0.3) and GHSA-qj8w-gfj5-8c6v (fixed in 7.0.5).
        resolution("serialize-javascript", "7.0.5")
        // mocha pins ^7.0.0 and jsdiff never patched the 7.x line. ReDoS in parsePatch/applyPatch
        // (GHSA-73rr-hh4g-fpgx, fixed in 8.0.3). mocha only calls diffLines/diffWordsWithSpace/
        // createPatch for assertion output, all unchanged across the 7 -> 8 major.
        resolution("diff", "8.0.4")
    }
}

// Copy the built JS library + generated TypeScript declarations into the RN app's source tree where
// Metro resolves them. Run after `jsNodeProductionLibraryDistribution`. `npm run build:core` invokes
// this. The .d.ts lands at ../my-app/src/generated/chess-core/chess-core.d.ts.
val copyJsToApp by tasks.registering(Copy::class) {
    description = "Copies the production JS library + .d.ts into ../my-app/src/generated/chess-core for Metro."
    group = "build"
    from(layout.buildDirectory.dir("dist/js/productionLibrary"))
    into(rootProject.projectDir.resolve("../my-app/src/generated/chess-core"))
    dependsOn("jsNodeProductionLibraryDistribution")
}

