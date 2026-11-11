import type { Server } from 'node:http';
import { WebSocket } from 'ws';
import { Store } from './store.js';
import { Logger, type LogLevel } from './logger.js';
import { type GatewayTimingOptions } from './config.js';
export interface GatewayOptions extends GatewayTimingOptions {
    maxFramesPerSec?: number;
    logLevel?: LogLevel;
    logger?: Logger;
    /** Advertise `transport.turn` (and accept TURN credential requests). */
    turnEnabled?: boolean;
}
type Peer = {
    ws: WebSocket;
    id: string;
    role: 'host' | 'client';
    capabilities: string[];
    version: string;
    lastPong: number;
    nonce?: string;
    evictedTombstoneUntil?: number;
};
/** Protocol v1 default: at most 256 ICE candidates per logical connection. */
export declare const MAX_ICE_CANDIDATES_PER_CONNECTION = 256;
export declare class Gateway {
    private store;
    readonly peers: Map<string, Peer>;
    private links;
    private droppedLinks;
    private wss;
    private heartbeat;
    private closed;
    readonly turnEnabled: boolean;
    readonly helloTimeoutMs: number;
    readonly heartbeatIntervalMs: number;
    readonly heartbeatDisconnectMs: number;
    readonly forceTerminateGraceMs: number;
    readonly maxFramesPerSec: number;
    readonly logger: Logger;
    constructor(server: Server, store: Store, origin: string, options?: GatewayOptions);
    private pruneDroppedLinks;
    private evictDroppedLink;
    private recordDroppedLink;
    private isDroppedLinkFrame;
    droppedLinkFrameCount(connectionId: string): number;
    private send;
    private drop;
    disconnect(id: string, code: string): void;
    /**
     * Authorize a REST `/api/v1/turn/credentials` request. Only the two devices
     * of an active logical connection may obtain credentials, and only while
     * that connection is still being established.
     */
    authorizeIce(deviceId: string, connectionId: string): boolean;
    private supportedCapabilities;
    private negotiatedCapabilities;
    private accept;
    private handle;
    /**
     * Forward WebRTC signaling only while the logical connection is being
     * established, and only for a transport this link actually negotiated. A
     * relay-only link has no data plane to coordinate — the Host treats
     * unsolicited signaling as a protocol violation that closes its whole
     * Control connection and every tunnel on it, so such frames are dropped for
     * the Client to time out and fall back to Relay.
     */
    private forwardSignal;
    /**
     * Forward the initiator's transport choice, gated on the transports the
     * link negotiated. `lan` is downgraded to `p2p` only when the link did not
     * negotiate `transport.lan` (old RC2 peers), as required by
     * docs/protocol.md. Relay keeps the legacy compatibility gate.
     */
    private forwardTransportSelected;
    close(): void;
}
export {};
//# sourceMappingURL=gateway.d.ts.map