/**
 * Structured, single-line JSON logging with defensive redaction.
 *
 * Two invariants hold for everything in this module:
 *  1. Secrets never reach the sink: credential-looking keys, URL query
 *     parameters, JSON string fields and Bearer/Basic headers are redacted at
 *     any nesting depth.
 *  2. Logging never throws. A hostile `meta` object (throwing getter, proxy,
 *     BigInt, circular graph, throwing `toJSON`) must not be able to break a
 *     request or a WebSocket frame handler.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export declare const LOG_LEVEL_SEVERITY: Record<LogLevel, number>;
/** Normalized (lowercase, separators stripped) key suffixes treated as secret. */
export declare const SENSITIVE_KEYS: readonly string[];
export declare function isSensitiveKey(key: string): boolean;
/**
 * Deep-copy `data` with secrets replaced. Never throws: unserializable input
 * degrades to the `[UNSERIALIZABLE]` marker instead of propagating.
 */
export declare function redactSensitive(data: unknown, seen?: WeakSet<object>, depth?: number): unknown;
export interface LogEntry {
    ts: string;
    level: LogLevel;
    scope: string;
    event: string;
    meta: Record<string, unknown>;
}
export type LogSink = (line: string, entry: LogEntry) => void;
export declare class Logger {
    readonly scope: string;
    readonly level: LogLevel;
    private readonly sink?;
    constructor(scope?: string, level?: LogLevel, sink?: LogSink);
    child(subScope: string): Logger;
    debug(event: string, meta?: Record<string, unknown>): void;
    info(event: string, meta?: Record<string, unknown>): void;
    warn(event: string, meta?: Record<string, unknown>): void;
    error(event: string, meta?: Record<string, unknown>): void;
    private buildEntry;
    private log;
}
export declare function parseLogLevel(val: string | undefined, fallback?: LogLevel): LogLevel;
//# sourceMappingURL=logger.d.ts.map