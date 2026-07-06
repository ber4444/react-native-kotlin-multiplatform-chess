// chess-core — React Native consumer of the published `io.github.ber4444:chess-core` artifact.
//
// This module is a THIN Kotlin/JS (IR) wrapper: it depends on the chess engine core published from
// `ber4444/compose-multiplatform-chess` (the single source of truth for all rules, converters,
// GameViewModel, and 3D-board math) and adds only the RN-specific JS interop:
//   - ChessSession.kt        — the @JsExport facade the RN app calls (subscribe/select/move/...).
//   - JsChessEngineAdapter.kt — adapts a JS-Promise engine to the core's ChessEngine interface.
//
// No chess logic lives here. The Gradle `copyJsToApp` task drops the compiled JS library (the core
// + these two interop files) into ../my-app/src/generated/chess-core for Metro to resolve.
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

// Copy the built JS library (the core + RN interop) into the RN app's source tree where Metro
// resolves it. Run after `jsNodeProductionLibraryDistribution`. `npm run build:core` invokes this.
val copyJsToApp by tasks.registering(Copy::class) {
    description = "Copies the production JS library into ../my-app/src/generated/chess-core for Metro."
    group = "build"
    from(layout.buildDirectory.dir("dist/js/productionLibrary"))
    into(rootProject.projectDir.resolve("../my-app/src/generated/chess-core"))
    dependsOn("jsNodeProductionLibraryDistribution")
}
