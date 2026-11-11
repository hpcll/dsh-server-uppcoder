import { type AccountDeviceDescriptor } from '@dsh-remote/protocol';
import { z } from 'zod';
export declare class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, status?: number);
}
export declare const hash: (value: string) => string;
export declare const secret: () => string;
export declare const equal: (left: string, right: string) => boolean;
declare const savedDeviceSchema: z.ZodObject<{
    descriptor: z.ZodType<AccountDeviceDescriptor, unknown, z.core.$ZodTypeInternals<AccountDeviceDescriptor, unknown>>;
    revoked: z.ZodBoolean;
    lastSeenAt: z.ZodNumber;
}, z.core.$strip>;
type SavedDevice = z.infer<typeof savedDeviceSchema>;
/** Single-process store. Only token digests and public identities reach disk. */
export declare class Store {
    private readonly file;
    readonly account: string;
    private state;
    onInvalidate: (id: string) => void;
    constructor(file: string, account: string, password: string);
    private save;
    get(id: string): SavedDevice;
    list(): SavedDevice[];
    register(descriptor: AccountDeviceDescriptor): ReturnType<Store['issue']>;
    private issue;
    authenticate(token: string): SavedDevice;
    refresh(deviceId: string, token: string): {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: number;
        refreshTokenExpiresAt: number;
    };
    invalidate(deviceId: string): void;
    revoke(id: string): void;
    rename(id: string, name: string): void;
    touch(id: string, clientVersion?: string, harnessVersion?: string): void;
}
export {};
//# sourceMappingURL=store.d.ts.map