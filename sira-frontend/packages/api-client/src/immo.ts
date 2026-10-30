import type {
    AgenceAdmin,
    AgenceAgent,
    AgenceAnnonce,
    AgenceOnboarding,
    AgenceOnboardingRequest,
    Commodite,
    DemandeBesoin,
    LeadContactView,
    LeadVisiteView,
    PageMeta,
    Propriete,
    ProprieteDetail,
    Proprietaire,
    RechercheProprietesParams,
    RejeterRequest,
    TraiterLeadRequest,
    TypeBien
} from '@sira/core';
import type { QueryParams, SiraClient } from './http.js';

const BASE = '/immo';

/** Propriétés : recherche publique, cycle de vie annonce, modération. */
export function proprieteApi(client: SiraClient) {
    return {
        // ---- Public ----
        recherche: (params: RechercheProprietesParams) =>
            client.get<{ proprietes: Propriete[] } & PageMeta>(`${BASE}/proprietes/recherche`, { params: params as QueryParams, auth: false }),
        byUuid: (uuid: string) => client.get<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}`, { auth: false }),
        typesBien: () => client.get<{ typesBien: TypeBien[] }>(`${BASE}/types-bien`, { auth: false }),
        commodites: () => client.get<{ commodites: Commodite[] }>(`${BASE}/commodites`, { auth: false }),

        // ---- Propriétaire / agence ----
        mesProprietes: () => client.get<{ proprietes: Propriete[] }>(`${BASE}/proprietes/mes-proprietes`),
        create: (body: Partial<Propriete>) => client.post<{ propriete: Propriete }>(`${BASE}/proprietes`, { body }),
        update: (uuid: string, body: Partial<Propriete>) => client.put<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}`, { body }),
        publier: (uuid: string) => client.patch<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/publier`),
        retirer: (uuid: string) => client.patch<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/retirer`),
        renouveler: (uuid: string) => client.post<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/renouveler`),
        marquerVendu: (uuid: string) => client.patch<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/marquer-vendu`),
        marquerLoue: (uuid: string) => client.patch<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/marquer-loue`),
        uploadPhoto: (uuid: string, formData: FormData) => client.post<{ photo: unknown }>(`${BASE}/proprietes/${uuid}/photos`, { formData }),

        // ---- Modération (ADMIN / SUPER_ADMIN) ----
        moderation: (params?: { limit?: number; offset?: number }) =>
            client.get<{ proprietes: Propriete[] } & PageMeta>(`${BASE}/proprietes/moderation`, { params }),
        moderationDetail: (uuid: string) => client.get<ProprieteDetail>(`${BASE}/proprietes/moderation/${uuid}`),
        valider: (uuid: string) => client.patch<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/valider`),
        rejeter: (uuid: string, body: RejeterRequest) => client.patch<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}/rejeter`, { body })
    };
}

/** Favoris, contacts, visites, demandes de besoin, brouillons — parcours client mobile. */
export function immoClientApi(client: SiraClient) {
    return {
        favoris: () => client.get<{ proprietes: Propriete[] }>(`${BASE}/favoris/mes-favoris`),
        addFavori: (proprieteUuid: string) => client.post<Record<string, never>>(`${BASE}/favoris/${proprieteUuid}`),
        removeFavori: (proprieteUuid: string) => client.delete<Record<string, never>>(`${BASE}/favoris/${proprieteUuid}`),

        contacter: (proprieteUuid: string, body: { message: string; typeDemande?: string }) =>
            client.post<Record<string, never>>(`${BASE}/proprietes/${proprieteUuid}/contact`, { body }),
        demanderVisite: (proprieteUuid: string, body: { dateVisite: string; heureVisite?: string; notesVisiteur?: string }) =>
            client.post<Record<string, never>>(`${BASE}/proprietes/${proprieteUuid}/visites`, { body }),

        mesDemandes: (params?: { scope?: string; limit?: number; offset?: number }) =>
            client.get<{ demandes: DemandeBesoin[]; scope?: string } & PageMeta>(`${BASE}/demandes`, { params }),
        declarerBesoin: (body: Record<string, unknown>) => client.post<{ demande: unknown }>(`${BASE}/demandes`, { body }),

        brouillons: () => client.get<{ brouillons: unknown[] }>(`${BASE}/brouillons`),
        saveBrouillon: (body: Record<string, unknown>) => client.post<{ brouillon: unknown }>(`${BASE}/brouillons`, { body }),
        materialiserBrouillon: (uuid: string) => client.post<{ propriete: Propriete }>(`${BASE}/brouillons/${uuid}/materialiser`),

        monProfil: () => client.get<{ profil: unknown }>(`${BASE}/profils/me`)
    };
}

/** Agences : onboarding, back-office admin, conformité. */
export function agenceApi(client: SiraClient) {
    return {
        // Onboarding (ADMIN_IMMO)
        onboardingMe: () => client.get<{ agence: AgenceOnboarding }>(`${BASE}/agences/onboarding/me`),
        onboardingUpdate: (body: AgenceOnboardingRequest) => client.put<{ agence: AgenceOnboarding }>(`${BASE}/agences/onboarding`, { body }),
        onboardingUploadRccm: (formData: FormData) => client.post<Record<string, never>>(`${BASE}/agences/onboarding/rccm`, { formData }),
        onboardingSoumettre: () => client.post<{ agence: AgenceOnboarding }>(`${BASE}/agences/onboarding/soumettre`),

        // Back-office admin
        adminList: (params?: { limit?: number; offset?: number }) =>
            client.get<{ agences: AgenceAdmin[] } & PageMeta>(`${BASE}/agences/admin`, { params }),
        adminActivites: (uuid: string) =>
            client.get<{ agence?: AgenceAdmin; annonces: AgenceAnnonce[]; agents: AgenceAgent[]; representantNom?: string }>(
                `${BASE}/agences/admin/${uuid}/activites`
            ),

        // Conformité (ADMIN_CONFORMITE)
        conformiteList: (params?: { limit?: number; offset?: number }) =>
            client.get<{ agences: AgenceAdmin[] } & PageMeta>(`${BASE}/conformite/agences`, { params }),
        /** Le backend renvoie le document lui-même (InputStreamResource), pas une URL. */
        conformiteRccm: (uuid: string) => client.getBlob(`${BASE}/conformite/agences/${uuid}/rccm`),
        approuver: (uuid: string) => client.patch<{ agence: AgenceAdmin }>(`${BASE}/conformite/agences/${uuid}/approuver`),
        rejeterAgence: (uuid: string, body: RejeterRequest) => client.patch<{ agence: AgenceAdmin }>(`${BASE}/conformite/agences/${uuid}/rejeter`, { body })
    };
}

/** Leads back-office (autorités immo:lead:read / immo:lead:update). */
export function leadApi(client: SiraClient) {
    return {
        contacts: (params?: { statut?: string; limit?: number; offset?: number }) =>
            client.get<{ contacts: LeadContactView[] } & PageMeta>(`${BASE}/admin/contacts`, { params }),
        visites: (params?: { statut?: string; limit?: number; offset?: number }) =>
            client.get<{ visites: LeadVisiteView[] } & PageMeta>(`${BASE}/admin/visites`, { params }),
        traiterContact: (uuid: string, body: TraiterLeadRequest) => client.patch<Record<string, never>>(`${BASE}/admin/contacts/${uuid}`, { body }),
        traiterVisite: (uuid: string, body: TraiterLeadRequest) => client.patch<Record<string, never>>(`${BASE}/admin/visites/${uuid}`, { body }),
        proprietaire: (proprieteUuid: string) => client.get<{ proprietaire: Proprietaire }>(`${BASE}/admin/proprietes/${proprieteUuid}/proprietaire`)
    };
}
