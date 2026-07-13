type Nullable<T> = T | null | undefined
declare function KtSingleton<T>(): T & (abstract new() => any);
export declare namespace com.example.ondeviceai {
    function _forceTsDefinitions(): void;
    class OnDeviceAiSession {
        constructor();
        getRoutePolicyName(): string;
        getEmptyResponseComposerId(): string;
    }
    namespace OnDeviceAiSession {
        /** @deprecated $metadata$ is used for internal purposes, please don't use it in your code, because it can be removed at any moment */
        namespace $metadata$ {
            const constructor: abstract new () => OnDeviceAiSession;
        }
    }
}
export as namespace on_device_ai;