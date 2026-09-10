import type { ApiResponse } from '@sira/core';

/**
 * Fournisseur de jetons branché par l'app hôte (web ou mobile).
 * `refresh()` est appelé une seule fois sur un 401, puis la requête est rejouée —
 * c'est ce qui corrige la dette T1 (aucun refresh silencieux dans l'ancien Angular).
 */
export interface TokenProvider {
    getAccessToken(): Promise<string | null>;
    /** Retourne true si le refresh a réussi (la requête sera rejouée). */
    refresh(): Promise<boolean>;
}

export interface SiraClientConfig {
    /** URL du gateway, ex. https://api.sira-guinee.com ou http://localhost:9000 */
    baseUrl: string;
    tokenProvider?: TokenProvider;
    /** Appelé quand un 401 persiste après refresh : l'app déconnecte l'utilisateur. */
    onSessionExpired?: () => void;
    /** Timeout par requête en ms (défaut 30 000 — réseaux 3G Conakry). */
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly body?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export type QueryParams = Record<string, string | number | boolean | string[] | undefined | null>;

export interface RequestOptions {
    params?: QueryParams;
    body?: unknown;
    /** FormData pour les uploads multipart (photos immo, RCCM…). */
    formData?: FormData;
    /** false pour les endpoints publics : aucun header Authorization n'est envoyé. */
    auth?: boolean;
    signal?: AbortSignal;
}

export class SiraClient {
    constructor(private readonly config: SiraClientConfig) {}

    get baseUrl(): string {
        return this.config.baseUrl;
    }

    async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        const { auth = true } = options;
        let response = await this.doFetch(method, path, options, auth);

        if (response.status === 401 && auth && this.config.tokenProvider) {
            const refreshed = await this.config.tokenProvider.refresh();
            if (refreshed) {
                response = await this.doFetch(method, path, options, auth);
            }
            if (response.status === 401) {
                this.config.onSessionExpired?.();
            }
        }

        const text = await response.text();
        let parsed: unknown = undefined;
        if (text) {
            try {
                parsed = JSON.parse(text);
            } catch {
                parsed = text;
            }
        }

        if (!response.ok) {
            const message =
                parsed && typeof parsed === 'object' && 'message' in parsed
                    ? String((parsed as { message: unknown }).message)
                    : `Erreur HTTP ${response.status}`;
            throw new ApiError(message, response.status, parsed);
        }

        return parsed as ApiResponse<T>;
    }

    private async doFetch(method: string, path: string, options: RequestOptions, auth: boolean): Promise<Response> {
        const url = this.buildUrl(path, options.params);
        const headers: Record<string, string> = { Accept: 'application/json' };

        if (auth && this.config.tokenProvider) {
            const token = await this.config.tokenProvider.getAccessToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        let body: BodyInit | undefined;
        if (options.formData) {
            body = options.formData; // le navigateur pose le boundary multipart lui-même
        } else if (options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body);
        }

        const fetchImpl = this.config.fetchImpl ?? fetch;
        const timeout = AbortSignal.timeout(this.config.timeoutMs ?? 30_000);
        const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

        return fetchImpl(url, { method, headers, body, signal });
    }

    private buildUrl(path: string, params?: QueryParams): string {
        const url = new URL(path, this.config.baseUrl.endsWith('/') ? this.config.baseUrl : this.config.baseUrl + '/');
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value === undefined || value === null) continue;
                if (Array.isArray(value)) {
                    for (const v of value) url.searchParams.append(key, v);
                } else {
                    url.searchParams.set(key, String(value));
                }
            }
        }
        return url.toString();
    }

    get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('GET', path, options);
    }

    /**
     * Télécharge un binaire protégé par JWT (document RCCM servi depuis MinIO).
     * Le lien direct MinIO n'accepte pas le header Authorization : il faut passer
     * par le backend, récupérer un Blob, puis en faire une URL objet côté appelant.
     */
    async getBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
        const { auth = true } = options;
        let response = await this.doFetch('GET', path, options, auth);

        if (response.status === 401 && auth && this.config.tokenProvider) {
            const refreshed = await this.config.tokenProvider.refresh();
            if (refreshed) response = await this.doFetch('GET', path, options, auth);
            if (response.status === 401) this.config.onSessionExpired?.();
        }

        if (!response.ok) {
            throw new ApiError(`Erreur HTTP ${response.status}`, response.status);
        }
        return response.blob();
    }
    post<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('POST', path, options);
    }
    put<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', path, options);
    }
    patch<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', path, options);
    }
    delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', path, options);
    }
}
