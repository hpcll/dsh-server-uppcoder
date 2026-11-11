import { type IncomingMessage, type ServerResponse } from 'node:http';
import { Store } from './store.js';
import { Gateway } from './gateway.js';
import { type IceConfig } from './ice.js';
import { Logger, type LogLevel } from './logger.js';
import { FORCE_TERMINATE_GRACE_MS_RANGE, HEARTBEAT_DISCONNECT_MS_MAX, HELLO_TIMEOUT_MS_RANGE, HEARTBEAT_INTERVAL_MS_RANGE, MAX_FRAMES_PER_SEC_RANGE, normalizeForceTerminateGraceMs, normalizeGatewayOptions, normalizeHeartbeatDisconnectMs, normalizeHeartbeatIntervalMs, normalizeHelloTimeoutMs, normalizeMaxFramesPerSec } from './config.js';
export interface Config {
    account: string;
    password: string;
    dataFile: string;
    publicUrl: string;
    trustedProxyIps?: readonly string[];
    helloTimeoutMs?: number;
    heartbeatIntervalMs?: number;
    heartbeatDisconnectMs?: number;
    forceTerminateGraceMs?: number;
    maxFramesPerSec?: number;
    logLevel?: LogLevel;
    ice?: IceConfig;
}
/**
 * Timing configuration is normalized in one place (`config.ts`) so the CLI and
 * programmatic callers share the same bounds and fallbacks. These wrappers keep
 * the env-var parsing API used by `main.ts` and the tests, and never echo the
 * offending input in their warnings.
 */
export declare function parseHelloTimeout(val: string | undefined): number;
export declare function parseHeartbeatInterval(val: string | undefined): number;
export declare function parseHeartbeatDisconnect(val: string | undefined, heartbeatIntervalMs?: number): number;
export declare function parseForceTerminateGrace(val: string | undefined): number;
export declare function parseMaxFramesPerSec(val: string | undefined): number;
export { normalizeGatewayOptions, normalizeHelloTimeoutMs, normalizeHeartbeatIntervalMs, normalizeHeartbeatDisconnectMs, normalizeForceTerminateGraceMs, normalizeMaxFramesPerSec, HELLO_TIMEOUT_MS_RANGE, HEARTBEAT_INTERVAL_MS_RANGE, HEARTBEAT_DISCONNECT_MS_MAX, FORCE_TERMINATE_GRACE_MS_RANGE, MAX_FRAMES_PER_SEC_RANGE, };
export type { GatewayTimingOptions, NormalizedGatewayOptions } from './config.js';
/**
 * Normalize one bare IPv4/IPv6 literal to a single canonical form. IPv4-mapped
 * IPv6 addresses (e.g. ::ffff:127.0.0.1) collapse to plain IPv4, so a peer
 * observed through a dual-stack socket and a config entry compare equal.
 * Returns null for anything that is not a single IP literal: hostnames, ports,
 * CIDR ranges, comma-separated lists, bracketed hosts and zone identifiers.
 */
export declare function normalizeIp(value: string): string | null;
/** Validate and normalize the trusted proxy list at startup. Empty means disabled. */
export declare function normalizeTrustedProxyIps(values?: readonly string[]): ReadonlySet<string>;
/**
 * Resolve the address used for rate limiting. X-Forwarded-For is honored only
 * when the socket peer is a configured trusted proxy; that peer must send one
 * header holding exactly one IP literal, otherwise the request is rejected.
 */
export declare function clientAddress(req: IncomingMessage, trustedProxyIps: ReadonlySet<string>): string;
export declare function createRemoteServer(config: Config): {
    server: import("http").Server<typeof IncomingMessage, typeof ServerResponse>;
    store: Store;
    gateway: Gateway;
    logger: Logger;
    close: () => Promise<void>;
};
//# sourceMappingURL=server.d.ts.map