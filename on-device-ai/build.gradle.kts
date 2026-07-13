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
    }

    sourceSets {
        commonMain.dependencies {
            // The on-device AI orchestration (move coach, rules Q&A, opening explainer, route policy).
            implementation("io.github.ber4444:onDeviceAi:${property("onDeviceAiVersion")}")
            // coachApi comes transitively via onDeviceAi's api() dep, but declare it explicitly so the
            // smoke test can reference coachApi types (OpeningExplainResponse) directly.
            implementation("io.github.ber4444:coachApi:${property("coachApiVersion")}")
            implementation(libs.kotlinx.coroutines.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}
