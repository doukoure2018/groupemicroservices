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

/**
 * Inscription d'un particulier. Le serveur d'autorisation n'accepte pas de type
 * de compte et impose une adresse, d'où un corps distinct de RegisterRequest.
 */
export interface RegisterParticulierRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    /** Exigée par le serveur, limitée à 100 caractères en base. */
    address: string;
    phone?: string;
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
        /**
         * Inscription d'une agence immobilière. Ce chemin attribue ADMIN_IMMO et
         * mène à l'écran d'onboarding ; il reste donc le seul valable pour une
         * agence. Le même point d'entrée pour un particulier est cassé — voir
         * registerParticulier.
         */
        register: (body: RegisterRequest) => client.post<{ user: User }>(`${BASE}/register`, { body, auth: false }),
        /**
         * Inscription d'un particulier, par le serveur d'autorisation.
         *
         * `/user/register` ne peut pas créer de particulier : il passe onze
         * paramètres nommés à la procédure create_user, qui n'en déclare que
         * neuf, et la résolution de surcharge en Java y perd au passage le nom
         * d'utilisateur. Ce chemin-ci crée le compte, les identifiants, le rôle
         * USER et le jeton d'activation, puis émet le même événement Kafka :
         * l'email de vérification et le lien /auth/verify/account sont
         * identiques, et l'activation débloque le compte.
         *
         * Il ignore en revanche le type de compte et le nom d'utilisateur, qu'il
         * remplace par l'email. Ne jamais y router une agence.
         */
        registerParticulier: (body: RegisterParticulierRequest) =>
            client.post<Record<string, never>>('/authorization/api/auth/register', { body, auth: false }),
        verifyAccount: (token: string) => client.get<{ user: User }>(`${BASE}/verify/account`, { params: { token }, auth: false }),
        verifyPassword: (token: string) => client.get<{ user: User }>(`${BASE}/verify/password`, { params: { token }, auth: false }),
        /**
         * Contrôleur Java : @RequestParam("email"), donc en paramètre de requête
         * et non dans le corps. Envoyé dans le corps, le serveur répondait
         * « paramètre email requis », masqué en 401 par sa page d'erreur protégée :
         * la fonction n'avait jamais marché depuis le web.
         */
        resetPassword: (email: string) => client.post<Record<string, never>>(`${BASE}/resetpassword`, { params: { email }, auth: false }),
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
