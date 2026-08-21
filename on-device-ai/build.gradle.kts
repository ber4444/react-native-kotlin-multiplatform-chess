// on-device-ai — smoke consumer of the published `io.github.ber4444:ondeviceai` + `io.github.ber4444:coachapi`
// artifacts. This module proves the publish path end-to-end: it resolves both artifacts from GitHub
// Packages (or Maven Local during local dev), compiles against their public API on Kotlin/JS, and runs
// a test that references types from each. It does NOT add a @JsExport facade or wire into the RN app
// — that's a follow-up once the API surface for JS is designed.
//
// Mirror of the chess-core/ consumer module's pattern, minus the copyJsToApp + TS declarations.

plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

kotlin {
    js(IR) {
        nodejs()
        binaries.library()
        generateTypeScriptDefinitions()
    }

    sourceSets {
        commonMain.dependencies {
            // The on-device AI orchestration (move coach, rules Q&A, opening explainer, route policy).
            implementation("io.github.ber4444:ondeviceai:${property("onDeviceAiVersion")}")
            // coachApi comes transitively via onDeviceAi's api() dep, but declare it explicitly so the
            // smoke test can reference coachApi types (OpeningExplainResponse) directly.
            implementation("io.github.ber4444:coachapi:${property("coachApiVersion")}")
            implementation(libs.kotlinx.coroutines.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}

// Force patched transitive deps into the Kotlin/JS test toolchain — mirrors chess-core/build.gradle.kts.
// The Node test runner KGP downloads (mocha) pins versions that Dependabot flags; none of these ship
// anywhere, they only run during jsNodeTest. Only packages whose advisory fix falls *outside* mocha's
// declared range need a pin here — brace-expansion and js-yaml patch within range, so a plain lock
// refresh covers those. Run `./gradlew kotlinUpgradeYarnLock` after changing this to refresh
// kotlin-js-store/yarn.lock.
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

val copyJsToApp by tasks.registering(Copy::class) {
    description = "Copies the production JS library + .d.ts into ../my-app/src/generated/on-device-ai for Metro."
    group = "build"
    from(layout.buildDirectory.dir("dist/js/productionLibrary"))
    into(rootProject.projectDir.resolve("../my-app/src/generated/on-device-ai"))
    dependsOn("jsNodeProductionLibraryDistribution")
}
