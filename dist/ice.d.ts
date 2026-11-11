/**
 * Public ICE configuration for the self-hosted Server.
 *
 * The Server hands out short-lived TURN credentials (coturn REST API) or the
 * configured static pair; `DSH_SERVER_TURN_SECRET` never leaves the process.
 * STUN/TURN URLs are deployment configuration because this repository does
 * not hardcode public relay or TURN addresses.
 */
export interface IceConfig {
    readonly stunUrls: readonly string[];
    readonly turnUrls: readonly string[];
    readonly turnSecret: string | undefined;
    /** Static TURN credentials for deployments that cannot use a shared secret. */
    readonly turnUsername: string | undefined;
    readonly turnPassword: string | undefined;
    readonly turnTtlSeconds: number;
}
export interface IceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}
export declare const DEFAULT_TURN_TTL_SECONDS = 300;
/**
 * Parse and validate the environment. TURN is enabled only when the URLs and
 * a complete credential source (shared secret or static pair) are present; a
 * partial configuration fails startup so a deployment cannot silently
 * advertise TURN it cannot serve.
 */
export declare function parseIceConfig(env: Record<string, string | undefined>): IceConfig;
/**
 * Build the ICE server list for one device. With a shared secret the TURN
 * username is `<expiryUnixSeconds>:<deviceId>` and the credential is
 * `base64(HMAC-SHA1(secret, username))`, matching the coturn REST API; a
 * static pair is passed through as configured.
 */
export declare function buildIceServers(config: IceConfig, deviceId: string, now?: number): IceServer[];
//# sourceMappingURL=ice.d.ts.map