import type { Role, User } from '@sira/core';
import type { SiraClient } from './http.js';

const BASE = '/user';

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    phone?: string;
    /** PARTICULIER | AGENCE — le serveur attribue ADMIN_IMMO à une agence. */
    accountType?: 'PARTICULIER' | 'AGENCE';
}

export interface AdminCreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    /** Mot de passe temporaire communiqué à l'utilisateur. */
    password: string;
    /** Nom du rôle, restreint côté serveur à une liste blanche. */
    roleName: string;
}

/** Le pont web du mobile renvoie les jetons bruts, sans l'enveloppe standard. */
export interface MobileBridgeTokens {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
}

export interface AdminUpdateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}

export function userApi(client: SiraClient) {
    return {
        // ---- Public (sans Authorization) ----
        register: (body: RegisterRequest) => client.post<{ user: User }>(`${BASE}/register`, { body, auth: false }),
        verifyAccount: (token: string) => client.get<{ user: User }>(`${BASE}/verify/account`, { params: { token }, auth: false }),
        verifyPassword: (token: string) => client.get<{ user: User }>(`${BASE}/verify/password`, { params: { token }, auth: false }),
        resetPassword: (email: string) => client.post<Record<string, never>>(`${BASE}/resetpassword`, { body: { email }, auth: false }),
        resetPasswordConfirm: (body: { userUuid: string; token: string; password: string; confirmPassword: string }) =>
            client.post<Record<string, never>>(`${BASE}/resetpassword/reset`, { body, auth: false }),
        /**
         * Pont web du mobile : échange un jeton de vérification contre des jetons OAuth.
         * Attention, cette réponse n'a pas l'enveloppe `ApiResponse` des autres endpoints.
         */
        verifyMobile: (token: string) =>
            client.post<unknown>(`/authorization/api/auth/verify-mobile`, { body: { token }, auth: false }) as unknown as Promise<MobileBridgeTokens>,

        // ---- Authentifié ----
        profile: () => client.get<{ user: User }>(`${BASE}/profile`),
        instanceUser: () => client.get<{ user: User }>(`${BASE}/instanceUser`),
        updateProfile: (body: Partial<User>) => client.patch<{ user: User }>(`${BASE}/update`, { body }),

        // ---- Administration ----
        list: () => client.get<{ users: User[] }>(`${BASE}/list`),
        roles: () => client.get<{ roles: Role[] }>(`${BASE}/roles`),
        updateRole: (uuid: string, role: string) => client.patch<{ user: User }>(`${BASE}/${uuid}/role`, { body: { role } }),
        adminCreate: (body: AdminCreateUserRequest) => client.post<{ user: User }>(`${BASE}/admin/create`, { body }),
        toggleEnabled: (uuid: string) => client.patch<{ user: User }>(`${BASE}/${uuid}/toggle-enabled`),
        adminUpdate: (uuid: string, body: AdminUpdateUserRequest) => client.patch<{ user: User }>(`${BASE}/${uuid}/update`, { body })
    };
}
