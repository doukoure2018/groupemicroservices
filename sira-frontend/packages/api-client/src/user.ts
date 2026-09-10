import type { Role, User } from '@sira/core';
import type { SiraClient } from './http.js';

const BASE = '/user';

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    /** PARTICULIER | AGENCE — une agence reçoit le rôle ADMIN_IMMO. */
    typeCompte?: 'PARTICULIER' | 'AGENCE';
}

export interface AdminCreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export function userApi(client: SiraClient) {
    return {
        // ---- Public (sans Authorization) ----
        register: (body: RegisterRequest) => client.post<{ user: User }>(`${BASE}/register`, { body, auth: false }),
        verifyAccount: (token: string) => client.get<{ user: User }>(`${BASE}/verify/account`, { params: { token }, auth: false }),
        verifyPassword: (token: string) => client.get<{ user: User }>(`${BASE}/verify/password`, { params: { token }, auth: false }),
        resetPassword: (email: string) => client.post<Record<string, never>>(`${BASE}/resetpassword`, { body: { email }, auth: false }),
        resetPasswordConfirm: (body: { token: string; password: string; confirmPassword: string }) =>
            client.post<Record<string, never>>(`${BASE}/resetpassword/reset`, { body, auth: false }),

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
        adminUpdate: (uuid: string, body: Partial<User>) => client.put<{ user: User }>(`${BASE}/${uuid}/update`, { body })
    };
}
