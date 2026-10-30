/**
 * Enveloppe de réponse standard du backend (classe `Response` de chaque service).
 * `T` décrit le contenu réel de `data` pour chaque endpoint — c'est l'amélioration
 * principale par rapport à l'ancien `IResponse` Angular dont le `data` fourre-tout
 * rendait tous les champs optionnels.
 */
export interface ApiResponse<T = Record<string, unknown>> {
    time: string;
    code: number;
    status: string;
    message: string;
    path?: string;
    exception?: string;
    data: T;
}

/** Métadonnées de pagination renvoyées par certains endpoints (leads, recherche immo…). */
export interface PageMeta {
    total?: number;
    limit?: number;
    offset?: number;
}

/** Statistiques génériques actif/inactif utilisées par plusieurs référentiels. */
export interface ActifStats {
    total: number;
    actifs: number;
    inactifs: number;
}
