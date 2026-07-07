// Thin Kotlin/JS bindings over the published `io.github.ber4444:chess-core` artifact.
//
// All chess rules, converters, GameViewModel, and 3D-board math live in the published core
// (built + released from ber4444/compose-multiplatform-chess). This module only adds the
// `@JsExport` JS interop facade (`ChessSession` + `JsChessEngineAdapter`) that the React Native
// app consumes. Run `npm run build:core` from my-app to regenerate the JS bundle.
//
// Auth for resolving the GitHub Packages dep: export GITHUB_ACTOR + GITHUB_TOKEN (CI), or set
// gpr.user / gpr.key in ~/.gradle/gradle.properties (local dev).

plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

kotlin {
    // Single target: Kotlin/JS (IR) as a consumable library. The same artifact runs in the RN
    // JS runtime (Hermes/JSC on native, browser/V8 on web/Electron).
    js(IR) {
        // nodejs() gives reliable headless testing (no Karma/Chrome dependency) and produces the
        // same Kotlin/JS IR library output that RN consumes on every platform.
        nodejs()
        // Produce an importable JS library (ESM/UMD + package.json) consumed by the RN app.
        binaries.library()
    }

    sourceSets {
        commonMain.dependencies {
            // The published chess engine core. Replaces the ~25-file vendored source copy.
            // `api(kotlinx-coroutines-core)` in the core brings StateFlow onto the compile classpath
            // transitively; kermit is pulled as an `implementation` and linked into the JS bundle.
            implementation("io.github.ber4444:chess-core:0.2.0")
        }
    }
}

// Copy the built JS library (and its kotlin/coroutines/kermit siblings) into the RN
// app's source tree where Metro resolves it. Run after `jsNodeProductionLibraryDistribution`.
// `npm run build:core` in my-app invokes this.
val copyJsToApp by tasks.registering(Copy::class) {
    description = "Copies the production JS library into ../my-app/src/generated/chess-core for Metro."
    group = "build"
    from(layout.buildDirectory.dir("dist/js/productionLibrary"))
    into(rootProject.projectDir.resolve("../my-app/src/generated/chess-core"))
    dependsOn("jsNodeProductionLibraryDistribution")
}
