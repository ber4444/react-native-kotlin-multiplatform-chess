package com.example.ondeviceai

import com.example.coachapi.OpeningExplainResponse
import com.example.ondeviceai.AiRoutePolicies
import com.example.ondeviceai.AiRoutePolicy

/**
 * Smoke references proving the published `io.github.ber4444:onDeviceAi` + `io.github.ber4444:coachApi`
 * artifacts resolve and their public types are reachable from a Kotlin/JS consumer. This is NOT an
 * @JsExport facade — it just touches one type from each artifact so a compile failure means the
 * publish path broke.
 */
object SmokeReferences {
    /** From :onDeviceAi — the route policy for the offline move coach. */
    val moveCoachPolicy: AiRoutePolicy = AiRoutePolicies.moveCoachOffline

    /** From :coachApi — the wire model returned by the opening explainer service. */
    fun emptyResponse(): OpeningExplainResponse = OpeningExplainResponse(
        text = "",
        passages = emptyList(),
        composerId = "smoke",
    )
}
