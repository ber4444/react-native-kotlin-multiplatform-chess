package com.example.ondeviceai

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

/**
 * Proves the published onDeviceAi + coachApi artifacts resolve and their public types are callable
 * on Kotlin/JS. If this test compiles and passes, the publish→consume path works end-to-end.
 */
class SmokeReferencesTest {
    @Test
    fun moveCoachPolicy_resolves_from_published_artifact() {
        // AiRoutePolicies.moveCoachOffline is a public object in :onDeviceAi commonMain.
        val policy = SmokeReferences.moveCoachPolicy
        assertNotNull(policy)
    }

    @Test
    fun coachApi_type_is_reachable_transitively() {
        // OpeningExplainResponse is a public data class in :coachApi. It reaches this consumer
        // transitively via onDeviceAi's api(project(":coachApi")) dependency.
        val response = SmokeReferences.emptyResponse()
        assertEquals("smoke", response.composerId)
    }
}
