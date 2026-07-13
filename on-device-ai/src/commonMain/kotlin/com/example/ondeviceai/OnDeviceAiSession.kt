@file:OptIn(kotlin.js.ExperimentalJsExport::class)
package com.example.ondeviceai

import com.example.coachapi.OpeningExplainResponse

/**
 * JS facade for the React Native app.
 * Exposes core `onDeviceAi` primitives to JS.
 */
@JsExport
fun _forceTsDefinitions() {}

@JsExport
class OnDeviceAiSession {
    /**
     * Example exposure of a route policy.
     */
    fun getRoutePolicyName(): String = SmokeReferences.moveCoachPolicy.toString()

    /**
     * Example exposure of a response.
     */
    fun getEmptyResponseComposerId(): String = SmokeReferences.emptyResponse().composerId
}
