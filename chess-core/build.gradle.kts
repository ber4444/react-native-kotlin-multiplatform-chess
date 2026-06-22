plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

kotlin {
    // Single target: Kotlin/JS (IR) as a consumable library. The same artifact runs in the RN
    // JS runtime (Hermes/JSC on native, browser/V8 on web/Electron) — see plan §5.1.
    js(IR) {
        // nodejs() gives reliable headless testing (no Karma/Chrome dependency) and produces the
        // same Kotlin/JS IR library output that RN consumes on every platform. The chess-core has
        // no DOM access, so node is a valid runtime for both tests and the shipped artifact.
        nodejs()
        // Produce an importable JS library (ESM/UMD + package.json) consumed by the RN app.
        binaries.library()
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kermit)
        }
        commonTest.dependencies {
            implementation(libs.kotlinx.coroutines.test)
            implementation(kotlin("test"))
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
