import type {
    AgenceAdmin,
    AgenceAgent,
    AgenceAnnonce,
    AgenceOnboarding,
    AgenceOnboardingRequest,
    Brouillon,
    BrouillonSaveRequest,
    Commodite,
    ContactCreateRequest,
    DemandeBesoin,
    DemandeCreateRequest,
    LeadContact,
    LeadVisite,
    LeadContactView,
    LeadVisiteView,
    PageMeta,
    Photo,
    PreferencesNotificationImmo,
    ProfilImmo,
    ProfilImmoRequest,
    Propriete,
    ProprieteDetail,
    Proprietaire,
    RechercheProprietesParams,
    RejeterRequest,
    SignalementCreateRequest,
    TraiterLeadRequest,
    VisiteCreateRequest,
    TypeBien
} from '@sira/core';
import type { QueryParams, SiraClient } from './http.js';

const BASE = '/immo';

/** Propriétés : recherche publique, cycle de vie annonce, modération. */
export function proprieteApi(client: SiraClient) {
    return {
        // ---- Public ----
        /**
         * Recherche publique. Le jeton est envoyé s'il y en a un : le serveur
         * renseigne alors `isFavorite` sur chaque bien ; sans jeton, la
         * recherche reste ouverte et le champ vaut null.
         */
        recherche: (params: RechercheProprietesParams) =>
            // `auth` reste au défaut : le jeton part s'il y en a un, sinon rien.
            client.get<{ proprietes: Propriete[]; total: number; limit: number; offset: number; tri?: string }>(`${BASE}/proprietes/recherche`, {
                params: params as QueryParams
            }),
        byUuid: (uuid: string) => client.get<{ propriete: Propriete }>(`${BASE}/proprietes/${uuid}`, { auth: false }),
        typesBien: () => client.get<{ types: TypeBien[] }>(`${BASE}/types-bien`, { auth: false }),
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
        supprimer: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/proprietes/${uuid}`),
        /** Le champ multipart s'appelle `file` ; douze photos au plus par bien. */
        uploadPhoto: (uuid: string, formData: FormData) => client.post<{ photo: Photo }>(`${BASE}/proprietes/${uuid}/photos`, { formData }),
        photos: (uuid: string) => client.get<{ photos: Photo[] }>(`${BASE}/proprietes/${uuid}/photos`),
        definirCouverture: (photoUuid: string) => client.patch<{ photo: Photo }>(`${BASE}/photos/${photoUuid}/couverture`),
        supprimerPhoto: (photoUuid: string) => client.delete<Record<string, never>>(`${BASE}/photos/${photoUuid}`),

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
        favoris: (params?: { limit?: number; offset?: number }) =>
            client.get<{ proprietes: Propriete[]; total: number; limit: number; offset: number }>(`${BASE}/favoris/mes-favoris`, { params }),
        estFavori: (proprieteUuid: string) => client.get<{ isFavorite: boolean }>(`${BASE}/favoris/check`, { params: { proprieteUuid } }),
        addFavori: (proprieteUuid: string) => client.post<{ ajouteCetteFois: boolean }>(`${BASE}/favoris/${proprieteUuid}`),
        removeFavori: (proprieteUuid: string) => client.delete<{ retire: boolean }>(`${BASE}/favoris/${proprieteUuid}`),

        // ---- Entrer en relation avec le publieur d'un bien (session requise) ----
        contacter: (proprieteUuid: string, body: ContactCreateRequest) => client.post<{ contact: LeadContact }>(`${BASE}/proprietes/${proprieteUuid}/contact`, { body }),
        demanderVisite: (proprieteUuid: string, body: VisiteCreateRequest) => client.post<{ visite: LeadVisite }>(`${BASE}/proprietes/${proprieteUuid}/visites`, { body }),
        signaler: (proprieteUuid: string, body: SignalementCreateRequest) => client.post<{ signalement: unknown }>(`${BASE}/proprietes/${proprieteUuid}/signaler`, { body }),

        // ---- Ce que j'ai demandé : chaque ligne porte le bien visé (uuid, référence, titre) ----
        mesContactsEnvoyes: (params?: { limit?: number; offset?: number }) =>
            client.get<{ contacts: LeadContactView[]; total: number; limit: number; offset: number }>(`${BASE}/contacts/mes-contacts-envoyes`, { params }),
        mesVisites: (params?: { limit?: number; offset?: number }) =>
            client.get<{ visites: LeadVisiteView[]; total: number; limit: number; offset: number }>(`${BASE}/visites/mes-demandes`, { params }),
        annulerVisite: (visiteUuid: string, motifAnnulation?: string) =>
            client.patch<{ visite: LeadVisite }>(`${BASE}/visites/${visiteUuid}/annuler`, { body: { motifAnnulation } }),

        // ---- Besoins déclarés ----
        /** Les besoins que j'ai déclarés moi-même. */
        mesBesoins: () => client.get<{ demandes: DemandeBesoin[]; total: number }>(`${BASE}/demandes/mes-demandes`),
        declarerBesoin: (body: DemandeCreateRequest) => client.post<{ demande: DemandeBesoin }>(`${BASE}/demandes`, { body }),
        annulerBesoin: (demandeUuid: string) => client.patch<{ demande: DemandeBesoin }>(`${BASE}/demandes/${demandeUuid}/annuler`),
        /** Côté agence : les besoins de la zone (ou tous), tels que le site les liste. Ce n'est pas « mes » demandes au sens du client. */
        mesDemandes: (params?: { scope?: string; limit?: number; offset?: number }) =>
            client.get<{ demandes: DemandeBesoin[]; scope?: string } & PageMeta>(`${BASE}/demandes`, { params }),

        // ---- Brouillons d'annonce : sauvegardés étape par étape, puis transformés en annonce ----
        brouillons: () => client.get<{ brouillons: Brouillon[] }>(`${BASE}/brouillons`),
        brouillon: (uuid: string) => client.get<{ brouillon: Brouillon }>(`${BASE}/brouillons/${uuid}`),
        creerBrouillon: (body: BrouillonSaveRequest) => client.post<{ brouillon: Brouillon }>(`${BASE}/brouillons`, { body }),
        majBrouillon: (uuid: string, body: BrouillonSaveRequest) => client.put<{ brouillon: Brouillon }>(`${BASE}/brouillons/${uuid}`, { body }),
        supprimerBrouillon: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/brouillons/${uuid}`),
        /** Crée l'annonce (statut BROUILLON) à partir du brouillon ; les photos puis la publication viennent ensuite. */
        materialiserBrouillon: (uuid: string) => client.post<{ propriete: Propriete }>(`${BASE}/brouillons/${uuid}/materialiser`),

        /** 404 tant que l'utilisateur n'a pas de profil immobilier. */
        monProfil: () => client.get<{ profil: ProfilImmo }>(`${BASE}/profils/me`),
        creerProfil: (body: ProfilImmoRequest) => client.post<{ profil: ProfilImmo }>(`${BASE}/profils`, { body }),

        // ---- Préférences de notification du logement (SMS envoyés par le service immobilier) ----
        preferences: () => client.get<{ preferences: PreferencesNotificationImmo }>(`${BASE}/preferences`),
        majPreferences: (body: Partial<PreferencesNotificationImmo>) => client.patch<{ preferences: PreferencesNotificationImmo }>(`${BASE}/preferences`, { body })
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
