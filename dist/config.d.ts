/**
 * Gateway timing configuration: one normalization path for every entry point.
 *
 * Both the CLI (`main.ts` / `server.ts` parsing env vars) and programmatic
 * construction (`new Gateway(...)`, `createRemoteServer({ ... })`) must funnel
 * through these helpers. A raw `NaN`, `Infinity`, negative or absurdly large
 * value reaching `setTimeout`/`setInterval` is silently coerced by Node into
 * 1ms, which turns a misconfiguration into a connection storm, so every value
 * is range-checked and replaced with a documented fallback.
 */
export interface GatewayTimingOptions {
    helloTimeoutMs?: number;
    heartbeatIntervalMs?: number;
    heartbeatDisconnectMs?: number;
    forceTerminateGraceMs?: number;
}
export type NormalizedGatewayOptions = Required<GatewayTimingOptions>;
export declare const HELLO_TIMEOUT_MS_RANGE: {
    readonly min: 1000;
    readonly max: 60000;
    readonly fallback: 5000;
};
export declare const HEARTBEAT_INTERVAL_MS_RANGE: {
    readonly min: 5000;
    readonly max: 120000;
    readonly fallback: 25000;
};
export declare const FORCE_TERMINATE_GRACE_MS_RANGE: {
    readonly min: 100;
    readonly max: 10000;
    readonly fallback: 1000;
};
export declare const MAX_FRAMES_PER_SEC_RANGE: {
    readonly min: 64;
    readonly max: 65536;
    readonly fallback: 512;
};
/** A heartbeat disconnect threshold below two intervals drops healthy peers. */
export declare const HEARTBEAT_DISCONNECT_MS_MIN_FACTOR = 2;
export declare const HEARTBEAT_DISCONNECT_MS_MAX = 600000;
export declare const HEARTBEAT_DISCONNECT_MS_FLOOR = 75000;
export declare const HEARTBEAT_DISCONNECT_MS_FACTOR = 3;
export declare function normalizeHelloTimeoutMs(value: unknown): number;
export declare function normalizeHeartbeatIntervalMs(value: unknown): number;
/** Fallback scales with the interval so a slower heartbeat still tolerates two missed rounds. */
export declare function heartbeatDisconnectFallback(heartbeatIntervalMs: number): number;
export declare function normalizeHeartbeatDisconnectMs(value: unknown, heartbeatIntervalMs: number): number;
export declare function normalizeForceTerminateGraceMs(value: unknown): number;
export declare function normalizeMaxFramesPerSec(value: unknown): number;
/**
 * Single normalization point shared by the Gateway constructor and
 * `createRemoteServer`, so no caller can inject an unsafe timer value.
 */
export declare function normalizeGatewayOptions(options?: GatewayTimingOptions | null): NormalizedGatewayOptions;
//# sourceMappingURL=config.d.ts.map