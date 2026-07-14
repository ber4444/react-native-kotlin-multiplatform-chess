// on-device-ai — smoke consumer of the published `io.github.ber4444:onDeviceAi` + `io.github.ber4444:coachApi`
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

// Force a patched serialize-javascript into the Kotlin/JS test toolchain. The Node test runner KGP
// downloads (mocha) pins serialize-javascript ^6.0.2, which is covered by two advisories: code
// injection via RegExp.flags / Date.toISOString (GHSA-5c6j-r48x-rmvq, fixed in 7.0.3) and
// GHSA-qj8w-gfj5-8c6v (fixed in 7.0.5). It is only pulled in for the jsNodeTest task and never ships
// in the RN bundle, but Dependabot flags it regardless. A Yarn `resolution` pins the whole
// dependency tree to the patched release; run `./gradlew kotlinUpgradeYarnLock` after changing this
// to refresh kotlin-js-store/yarn.lock.
rootProject.plugins.withType<org.jetbrains.kotlin.gradle.targets.js.yarn.YarnPlugin> {
    rootProject.the<org.jetbrains.kotlin.gradle.targets.js.yarn.YarnRootExtension>()
        .resolution("serialize-javascript", "7.0.5")
}


val copyJsToApp by tasks.registering(Copy::class) {
    description = "Copies the production JS library + .d.ts into ../my-app/src/generated/on-device-ai for Metro."
    group = "build"
    from(layout.buildDirectory.dir("dist/js/productionLibrary"))
    into(rootProject.projectDir.resolve("../my-app/src/generated/on-device-ai"))
    dependsOn("jsNodeProductionLibraryDistribution")
}
