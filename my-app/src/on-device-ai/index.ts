// Typed gateway to the Kotlin/JS on-device-ai library.
//
// The Kotlin/JS `@JsExport` facade (OnDeviceAiSession) lives under the
// `com.example.ondeviceai` namespace.

// The generated JS module. Its `.d.ts` ships the types under `com.example.ondeviceai`.
import aiModule from 'on-device-ai';

// The generated TypeScript declarations.
import type { com } from 'on-device-ai';

/** The Kotlin package namespace the @JsExport declarations live under. */
const ns = (aiModule as unknown as {
  'com': { 'example': { 'ondeviceai': typeof com.example.ondeviceai } }
}).com.example.ondeviceai;

export type OnDeviceAiSession = com.example.ondeviceai.OnDeviceAiSession;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional declaration merge
export const OnDeviceAiSession: { new (): OnDeviceAiSession } = ns.OnDeviceAiSession;
