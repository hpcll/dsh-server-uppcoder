import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { accountDeviceDescriptorSchema } from '@dsh-remote/protocol';
import { z } from 'zod';
export class ApiError extends Error {
    code;
    status;
    constructor(code, status = 400) {
        super(code);
        this.code = code;
        this.status = status;
    }
}
export const hash = (value) => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
export const equal = (left, right) => timingSafeEqual(Buffer.from(hash(left)), Buffer.from(hash(right)));
const tokenSchema = z.object({
    kind: z.enum(['access', 'refresh']), deviceId: z.string(), expires: z.number(), used: z.boolean(),
    recovery: z.object({ nonce: z.string().regex(/^[A-Za-z0-9_-]{43}$/), accessExpires: z.number().int().positive() }).optional(),
});
const savedDeviceSchema = z.object({ descriptor: accountDeviceDescriptorSchema, revoked: z.boolean(), lastSeenAt: z.number() });
const stateSchema = z.object({ version: z.literal(1), account: z.string(), salt: z.string(), verifier: z.string(), devices: z.record(z.string(), savedDeviceSchema), tokens: z.record(z.string(), tokenSchema) });
// Domain-separated HMACs keyed by the presented bearer, NOT its stored digest.
// The nonce alone cannot recover credentials from a copy of state.json.
function successor(token, nonce, deviceId) {
    const derive = (kind) => createHmac('sha256', token)
        .update(JSON.stringify(['ds-harness-remote/refresh/v1', deviceId, nonce, kind])).digest('base64url');
    return { accessToken: derive('access'), refreshToken: derive('refresh') };
}
/** Single-process store. Only token digests and public identities reach disk. */
export class Store {
    file;
    account;
    state;
    onInvalidate = () => { };
    constructor(file, account, password) {
        this.file = file;
        this.account = account;
        const previous = existsSync(file) ? stateSchema.parse(JSON.parse(readFileSync(file, 'utf8'))) : undefined;
        const salt = previous?.salt ?? secret();
        const verifier = scryptSync(password, salt, 32).toString('hex');
        this.state = previous ?? { version: 1, account, salt, verifier, devices: {}, tokens: {} };
        if (this.state.account !== account)
            this.state.devices = {};
        if (this.state.account !== account || !equal(this.state.verifier, verifier))
            this.state.tokens = {};
        Object.assign(this.state, { account, verifier });
        this.save();
    }
    save() {
        mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 });
        const tmp = `${this.file}.tmp`;
        writeFileSync(tmp, JSON.stringify(this.state), { mode: 0o600 });
        renameSync(tmp, this.file);
    }
    get(id) {
        const d = Object.hasOwn(this.state.devices, id) ? this.state.devices[id] : undefined;
        if (!d)
            throw new ApiError('DEVICE_NOT_FOUND', 404);
        if (d.revoked)
            throw new ApiError('DEVICE_REVOKED', 403);
        return d;
    }
    list() { return Object.values(this.state.devices).filter(d => !d.revoked); }
    register(descriptor) {
        const old = this.state.devices[descriptor.deviceId];
        if (old?.revoked)
            throw new ApiError('DEVICE_REVOKED', 403);
        if (old && (old.descriptor.identityKey !== descriptor.identityKey || old.descriptor.role !== descriptor.role))
            throw new ApiError('PEER_IDENTITY_MISMATCH', 409);
        if (!old && Object.keys(this.state.devices).length >= 256)
            throw new ApiError('RATE_LIMITED', 429);
        this.state.devices[descriptor.deviceId] = { descriptor, revoked: false, lastSeenAt: old?.lastSeenAt ?? 0 };
        this.invalidate(descriptor.deviceId);
        return this.issue(descriptor.deviceId);
    }
    issue(deviceId, refreshTokenExpiresAt = Date.now() + 30 * 86400_000, previous) {
        const tokens = { ...this.state.tokens };
        for (const [key, value] of Object.entries(tokens))
            if (value.expires <= Date.now())
                delete tokens[key];
        if (Object.keys(tokens).length + 2 > 16384)
            throw new ApiError('RATE_LIMITED', 429);
        const accessTokenExpiresAt = Date.now() + 60 * 60_000;
        const nonce = secret();
        const { accessToken, refreshToken } = previous
            ? successor(previous.token, nonce, deviceId)
            : { accessToken: secret(), refreshToken: secret() };
        if (previous)
            tokens[hash(previous.token)] = {
                ...previous.record, used: true, recovery: { nonce, accessExpires: accessTokenExpiresAt },
            };
        tokens[hash(accessToken)] = { kind: 'access', deviceId, expires: accessTokenExpiresAt, used: false };
        tokens[hash(refreshToken)] = { kind: 'refresh', deviceId, expires: refreshTokenExpiresAt, used: false };
        const before = this.state.tokens;
        this.state.tokens = tokens;
        // Commit consumption, recovery metadata and the successor together. A failed
        // write must leave the previous token usable both in memory and after restart.
        try {
            this.save();
        }
        catch (error) {
            this.state.tokens = before;
            throw error;
        }
        return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
    }
    authenticate(token) {
        const record = this.state.tokens[hash(token)];
        if (!record || record.kind !== 'access')
            throw new ApiError('AUTH_INVALID', 401);
        if (record.expires <= Date.now())
            throw new ApiError('TOKEN_EXPIRED', 401);
        return this.get(record.deviceId);
    }
    refresh(deviceId, token) {
        this.get(deviceId);
        const record = this.state.tokens[hash(token)];
        if (!record || record.kind !== 'refresh' || record.deviceId !== deviceId)
            throw new ApiError('AUTH_INVALID', 401);
        if (record.expires <= Date.now())
            throw new ApiError('TOKEN_EXPIRED', 401);
        if (!record.used)
            return this.issue(deviceId, record.expires, { token, record });
        // Legacy consumed tokens have no recovery record. Reject them without
        // invalidating credentials that may already be in use by this device.
        if (!record.recovery)
            throw new ApiError('AUTH_INVALID', 401);
        const pair = successor(token, record.recovery.nonce, deviceId);
        const next = this.state.tokens[hash(pair.refreshToken)];
        if (!next || next.kind !== 'refresh' || next.deviceId !== deviceId || next.expires !== record.expires) {
            throw new ApiError('INTERNAL_ERROR', 503);
        }
        if (next.used)
            throw new ApiError('AUTH_INVALID', 401);
        const access = this.state.tokens[hash(pair.accessToken)];
        if (access ? access.kind !== 'access' || access.deviceId !== deviceId || access.expires !== record.recovery.accessExpires
            : record.recovery.accessExpires > Date.now())
            throw new ApiError('INTERNAL_ERROR', 503);
        // Return the original expiry, including an expired access bearer. The
        // recovered, still-valid refresh token can then rotate normally.
        return { ...pair, accessTokenExpiresAt: record.recovery.accessExpires, refreshTokenExpiresAt: next.expires };
    }
    invalidate(deviceId) {
        for (const [key, value] of Object.entries(this.state.tokens))
            if (value.deviceId === deviceId)
                delete this.state.tokens[key];
        this.onInvalidate(deviceId);
        this.save();
    }
    revoke(id) { this.get(id).revoked = true; this.invalidate(id); }
    rename(id, name) {
        this.get(id).descriptor.name = name;
        this.save();
    }
    touch(id, clientVersion, harnessVersion) {
        const d = this.get(id);
        d.lastSeenAt = Date.now();
        if (clientVersion)
            d.descriptor.clientVersion = clientVersion.slice(0, 64);
        if (d.descriptor.role === 'host' && harnessVersion)
            d.descriptor.harnessVersion = harnessVersion.slice(0, 64);
        this.save();
    }
}
//# sourceMappingURL=store.js.map