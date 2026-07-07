pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        // GitHub Packages hosts io.github.ber4444:chess-core (published from
        // ber4444/compose-multiplatform-chess). Reads require auth: GITHUB_ACTOR/GITHUB_TOKEN
        // env vars (CI) or gpr.user/gpr.key gradle properties (local dev, ~/.gradle/gradle.properties).
        // The PAT must carry `read:packages`.
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/ber4444/compose-multiplatform-chess")
            credentials {
                username = System.getenv("GITHUB_ACTOR")
                    ?: providers.gradleProperty("gpr.user").orNull
                password = System.getenv("GITHUB_TOKEN")
                    ?: providers.gradleProperty("gpr.key").orNull
            }
        }
    }
}

rootProject.name = "chess-core"
