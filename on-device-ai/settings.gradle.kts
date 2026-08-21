pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositories {
        // Local dev: when iterating against an unpublished ondeviceai (e.g.
        // `:ondeviceai:publishToMavenLocal` in the compose-multiplatform-chess repo). Maven Local is
        // searched first so a freshly-published version wins over the published GitHub Packages one.
        mavenLocal()

        mavenCentral()

        // The published ondeviceai + coachapi artifacts live on GitHub Packages, which requires auth
        // even for public packages. Credentials come from env (CI) or ~/.gradle/gradle.properties:
        //   gpr.user = <github-username>
        //   gpr.key  = <PAT with read:packages>
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/ber4444/compose-multiplatform-chess")
            credentials {
                username = System.getenv("GITHUB_ACTOR") ?: providers.gradleProperty("gpr.user").orNull
                password = System.getenv("GITHUB_PACKAGES_TOKEN")
                    ?: System.getenv("GITHUB_TOKEN")
                    ?: providers.gradleProperty("gpr.key").orNull
            }
        }
    }
}

rootProject.name = "on-device-ai"
