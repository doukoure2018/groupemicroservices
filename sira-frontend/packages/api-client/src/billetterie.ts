import type {
    ActifStats,
    Arrivee,
    ArriveeRequest,
    Commune,
    CommuneCreateRequest,
    CommuneUpdateRequest,
    CommandeClient,
    CommandeCreateRequest,
    Depart,
    DepartRequest,
    Localisation,
    LocalisationCreateRequest,
    LocalisationUpdateRequest,
    ModeReglement,
    ModeReglementRequest,
    ModifierDateRequest,
    Offre,
    OffreRequest,
    OffreStats,
    Partenaire,
    PartenaireRequest,
    PlaceDetails,
    PlacePrediction,
    Quartier,
    QuartierCreateRequest,
    QuartierUpdateRequest,
    Region,
    RegionCreateRequest,
    RegionUpdateRequest,
    Site,
    SiteRequest,
    StatutPartenaire,
    Trajet,
    TrajetRequest,
    TypeVehicule,
    TypeVehiculeRequest,
    Vehicule,
    VehiculeRequest,
    Ville,
    VilleCreateRequest,
    VilleUpdateRequest
} from '@sira/core';
import type { SiraClient } from './http.js';

const BASE = '/billetterie';

/** Référentiel géographique (regions → villes → communes → quartiers → localisations). */
export function geoApi(client: SiraClient) {
    return {
        regions: () => client.get<{ regions: Region[] }>(`${BASE}/regions`),
        regionsActives: () => client.get<{ regions: Region[] }>(`${BASE}/regions/active`),
        setRegionActif: (uuid: string, actif: boolean) => client.patch<{ region: Region }>(`${BASE}/regions/${uuid}/status`, { body: { actif } }),
        createRegion: (body: RegionCreateRequest) => client.post<{ region: Region }>(`${BASE}/regions`, { body }),
        updateRegion: (uuid: string, body: RegionUpdateRequest) => client.put<{ region: Region }>(`${BASE}/regions/${uuid}`, { body }),
        deleteRegion: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/regions/${uuid}`),

        villes: () => client.get<{ villes: Ville[] }>(`${BASE}/villes`),
        /** Public — utilisé par la home sans authentification. */
        villesActives: () => client.get<{ villes: Ville[] }>(`${BASE}/villes/active`, { auth: false }),
        setVilleActif: (uuid: string, actif: boolean) => client.patch<{ ville: Ville }>(`${BASE}/villes/${uuid}/status`, { body: { actif } }),
        createVille: (body: VilleCreateRequest) => client.post<{ ville: Ville }>(`${BASE}/villes`, { body }),
        updateVille: (uuid: string, body: VilleUpdateRequest) => client.put<{ ville: Ville }>(`${BASE}/villes/${uuid}`, { body }),
        deleteVille: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/villes/${uuid}`),

        communes: () => client.get<{ communes: Commune[] }>(`${BASE}/communes`),
        communesActives: () => client.get<{ communes: Commune[] }>(`${BASE}/communes/active`),
        setCommuneActif: (uuid: string, actif: boolean) => client.patch<{ commune: Commune }>(`${BASE}/communes/${uuid}/status`, { body: { actif } }),
        createCommune: (body: CommuneCreateRequest) => client.post<{ commune: Commune }>(`${BASE}/communes`, { body }),
        updateCommune: (uuid: string, body: CommuneUpdateRequest) => client.put<{ commune: Commune }>(`${BASE}/communes/${uuid}`, { body }),
        deleteCommune: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/communes/${uuid}`),

        quartiers: () => client.get<{ quartiers: Quartier[] }>(`${BASE}/quartiers`),
        quartiersActifs: () => client.get<{ quartiers: Quartier[] }>(`${BASE}/quartiers/active`),
        setQuartierActif: (uuid: string, actif: boolean) => client.patch<{ quartier: Quartier }>(`${BASE}/quartiers/${uuid}/status`, { body: { actif } }),
        createQuartier: (body: QuartierCreateRequest) => client.post<{ quartier: Quartier }>(`${BASE}/quartiers`, { body }),
        updateQuartier: (uuid: string, body: QuartierUpdateRequest) => client.put<{ quartier: Quartier }>(`${BASE}/quartiers/${uuid}`, { body }),
        deleteQuartier: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/quartiers/${uuid}`),

        localisations: () => client.get<{ localisations: Localisation[] }>(`${BASE}/localisations`),
        createLocalisation: (body: LocalisationCreateRequest) => client.post<{ localisation: Localisation }>(`${BASE}/localisations`, { body }),
        updateLocalisation: (uuid: string, body: LocalisationUpdateRequest) =>
            client.put<{ localisation: Localisation }>(`${BASE}/localisations/${uuid}`, { body }),
        deleteLocalisation: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/localisations/${uuid}`),

        /** Proxy OpenStreetMap/Nominatim côté backend. */
        osmSearch: (q: string) => client.get<{ predictions: PlacePrediction[] }>(`${BASE}/osm/search`, { params: { query: q, country: 'gn', limit: 10 } }),
        /** Recherche restreinte à la Guinée — c'est l'endpoint utilisé par l'écran Localisations. */
        osmGuinea: (query: string, limit = 10) => client.get<{ predictions: PlacePrediction[] }>(`${BASE}/osm/guinea`, { params: { query, limit } }),
        osmReverse: (lat: number, lng: number) => client.get<{ place: PlaceDetails }>(`${BASE}/osm/reverse`, { params: { lat, lng } })
    };
}

/** Infrastructure transport : sites, points de départ/arrivée, trajets. */
export function transportApi(client: SiraClient) {
    return {
        sites: () => client.get<{ sites: Site[] }>(`${BASE}/sites`),
        sitesActifs: () => client.get<{ sites: Site[] }>(`${BASE}/sites/actifs`),
        sitesByVille: (villeUuid: string) => client.get<{ sites: Site[] }>(`${BASE}/sites/ville/${villeUuid}`),
        toggleSiteActif: (uuid: string) => client.patch<{ site: Site }>(`${BASE}/sites/${uuid}/toggle-actif`),
        createSite: (body: SiteRequest) => client.post<{ site: Site }>(`${BASE}/sites`, { body }),
        updateSite: (uuid: string, body: SiteRequest) => client.put<{ site: Site }>(`${BASE}/sites/${uuid}`, { body }),
        deleteSite: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/sites/${uuid}`),

        departs: () => client.get<{ departs: Depart[] }>(`${BASE}/departs`),
        departsActifs: () => client.get<{ departs: Depart[] }>(`${BASE}/departs/actifs`),
        departsBySite: (siteUuid: string) => client.get<{ departs: Depart[] }>(`${BASE}/departs/site/${siteUuid}`),
        departsActifsBySite: (siteUuid: string) => client.get<{ departs: Depart[] }>(`${BASE}/departs/site/${siteUuid}/actifs`),
        toggleDepartActif: (uuid: string) => client.patch<{ depart: Depart }>(`${BASE}/departs/${uuid}/toggle-actif`),
        createDepart: (body: DepartRequest) => client.post<{ depart: Depart }>(`${BASE}/departs`, { body }),
        updateDepart: (uuid: string, body: DepartRequest) => client.put<{ depart: Depart }>(`${BASE}/departs/${uuid}`, { body }),
        deleteDepart: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/departs/${uuid}`),

        arrivees: () => client.get<{ arrivees: Arrivee[] }>(`${BASE}/arrivees`),
        arriveesActifs: () => client.get<{ arrivees: Arrivee[] }>(`${BASE}/arrivees/actifs`),
        arriveesByDepart: (departUuid: string) => client.get<{ arrivees: Arrivee[] }>(`${BASE}/arrivees/depart/${departUuid}`),
        toggleArriveeActif: (uuid: string) => client.patch<{ arrivee: Arrivee }>(`${BASE}/arrivees/${uuid}/toggle-actif`),
        createArrivee: (body: ArriveeRequest) => client.post<{ arrivee: Arrivee }>(`${BASE}/arrivees`, { body }),
        updateArrivee: (uuid: string, body: ArriveeRequest) => client.put<{ arrivee: Arrivee }>(`${BASE}/arrivees/${uuid}`, { body }),
        deleteArrivee: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/arrivees/${uuid}`),

        trajets: () => client.get<{ trajets: Trajet[] }>(`${BASE}/trajets`),
        trajetsActifs: () => client.get<{ trajets: Trajet[] }>(`${BASE}/trajets/actifs`),
        mesTrajets: () => client.get<{ trajets: Trajet[] }>(`${BASE}/trajets/mes-trajets`),
        trajetsByDepart: (departUuid: string) => client.get<{ trajets: Trajet[] }>(`${BASE}/trajets/depart/${departUuid}`),
        trajetStats: () => client.get<ActifStats>(`${BASE}/trajets/stats`),
        createTrajet: (body: TrajetRequest) => client.post<{ trajet: Trajet }>(`${BASE}/trajets`, { body }),
        updateTrajet: (uuid: string, body: TrajetRequest) => client.put<{ trajet: Trajet }>(`${BASE}/trajets/${uuid}`, { body }),
        toggleTrajetActif: (uuid: string) => client.patch<{ trajet: Trajet }>(`${BASE}/trajets/${uuid}/toggle-actif`),
        deleteTrajet: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/trajets/${uuid}`)
    };
}

export interface RechercheOffresParams {
    villeDepartUuid?: string;
    villeArriveeUuid?: string;
    dateDepart?: string;
    [key: string]: string | undefined;
}

/** Offres de transport : recherche publique + CRUD + machine à états (9 transitions). */
export function offreApi(client: SiraClient) {
    const transition = (uuid: string, action: string) => client.patch<{ offre: Offre }>(`${BASE}/offres/${uuid}/${action}`);
    return {
        /** Public — recherche de la home et du mobile. */
        recherche: (params: RechercheOffresParams) => client.get<{ offres: Offre[] }>(`${BASE}/offres/recherche`, { params, auth: false }),
        list: () => client.get<{ offres: Offre[] }>(`${BASE}/offres`),
        ouvertes: () => client.get<{ offres: Offre[] }>(`${BASE}/offres/ouvertes`),
        mesOffres: () => client.get<{ offres: Offre[] }>(`${BASE}/offres/mes-offres`),
        byUuid: (uuid: string) => client.get<{ offre: Offre }>(`${BASE}/offres/${uuid}`),
        aujourdHui: () => client.get<{ offres: Offre[] }>(`${BASE}/offres/aujourd-hui`),
        aVenir: () => client.get<{ offres: Offre[] }>(`${BASE}/offres/a-venir`),
        passees: () => client.get<{ offres: Offre[] }>(`${BASE}/offres/passees`),
        promotions: () => client.get<{ offres: Offre[] }>(`${BASE}/offres/promotions`),
        stats: () => client.get<OffreStats>(`${BASE}/offres/stats`),
        mesStats: () => client.get<OffreStats>(`${BASE}/offres/mes-stats`),

        create: (body: OffreRequest) => client.post<{ offre: Offre }>(`${BASE}/offres`, { body }),
        update: (uuid: string, body: OffreRequest) => client.put<{ offre: Offre }>(`${BASE}/offres/${uuid}`, { body }),
        delete: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/offres/${uuid}`),

        ouvrir: (uuid: string) => transition(uuid, 'ouvrir'),
        fermer: (uuid: string) => transition(uuid, 'fermer'),
        cloturer: (uuid: string) => transition(uuid, 'cloturer'),
        annuler: (uuid: string) => transition(uuid, 'annuler'),
        demarrer: (uuid: string) => transition(uuid, 'demarrer'),
        terminer: (uuid: string) => transition(uuid, 'terminer'),
        suspendre: (uuid: string) => transition(uuid, 'suspendre'),
        reprendre: (uuid: string) => transition(uuid, 'reprendre'),
        setPromotion: (uuid: string, montantPromotion: number) =>
            client.patch<{ offre: Offre }>(`${BASE}/offres/${uuid}/promotion`, { body: { montantPromotion } }),
        removePromotion: (uuid: string) => client.delete<{ offre: Offre }>(`${BASE}/offres/${uuid}/promotion`),

        avis: (uuid: string) => client.get<{ avis: unknown[] }>(`${BASE}/offres/${uuid}/avis`, { auth: false })
    };
}

/** Commandes / réservations côté client. */
export function commandeApi(client: SiraClient) {
    return {
        create: (body: CommandeCreateRequest) => client.post<{ commande: CommandeClient }>(`${BASE}/commandes`, { body }),
        mesCommandes: () => client.get<{ commandes: CommandeClient[] }>(`${BASE}/commandes/mes-commandes`),
        byUuid: (uuid: string) => client.get<{ commande: CommandeClient }>(`${BASE}/commandes/${uuid}`),
        annuler: (uuid: string) => client.post<{ commande: CommandeClient }>(`${BASE}/commandes/${uuid}/annuler`),
        offresAlternatives: (uuid: string) => client.get<{ offres: Offre[] }>(`${BASE}/commandes/${uuid}/offres-alternatives`),
        modifierDate: (uuid: string, body: ModifierDateRequest) =>
            client.post<{ commande: CommandeClient }>(`${BASE}/commandes/${uuid}/modifier-date`, { body })
    };
}

/** Validation de billet par le contrôleur (scan QR). */
export function billetApi(client: SiraClient) {
    return {
        validate: (qrCodeData: string) => client.post<{ billet: unknown }>(`${BASE}/billets/validate`, { body: { qrCodeData } })
    };
}

/** Véhicules et types de véhicules. */
export function vehiculeApi(client: SiraClient) {
    return {
        vehicules: () => client.get<{ vehicules: Vehicule[] }>(`${BASE}/vehicules`),
        mesVehicules: () => client.get<{ vehicules: Vehicule[] }>(`${BASE}/vehicules/mes-vehicules`),
        activer: (uuid: string) => client.patch<{ vehicule: Vehicule }>(`${BASE}/vehicules/${uuid}/activer`),
        desactiver: (uuid: string) => client.patch<{ vehicule: Vehicule }>(`${BASE}/vehicules/${uuid}/desactiver`),
        maintenance: (uuid: string) => client.patch<{ vehicule: Vehicule }>(`${BASE}/vehicules/${uuid}/maintenance`),
        suspendre: (uuid: string) => client.patch<{ vehicule: Vehicule }>(`${BASE}/vehicules/${uuid}/suspendre`),
        stats: () => client.get<ActifStats & { enMaintenance?: number; suspendus?: number }>(`${BASE}/vehicules/stats`),
        assurancesExpirees: () => client.get<{ vehicules: Vehicule[] }>(`${BASE}/vehicules/assurance-expiree`),
        visitesExpirees: () => client.get<{ vehicules: Vehicule[] }>(`${BASE}/vehicules/visite-expiree`),
        create: (body: VehiculeRequest) => client.post<{ vehicule: Vehicule }>(`${BASE}/vehicules`, { body }),
        update: (uuid: string, body: VehiculeRequest) => client.put<{ vehicule: Vehicule }>(`${BASE}/vehicules/${uuid}`, { body }),
        delete: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/vehicules/${uuid}`),

        typesVehicules: () => client.get<{ typesVehicules: TypeVehicule[] }>(`${BASE}/types-vehicules`),
        createType: (body: TypeVehiculeRequest) => client.post<{ typeVehicule: TypeVehicule }>(`${BASE}/types-vehicules`, { body }),
        updateType: (uuid: string, body: TypeVehiculeRequest) =>
            client.put<{ typeVehicule: TypeVehicule }>(`${BASE}/types-vehicules/${uuid}`, { body }),
        deleteType: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/types-vehicules/${uuid}`),
        toggleTypeActif: (uuid: string) => client.patch<{ typeVehicule: TypeVehicule }>(`${BASE}/types-vehicules/${uuid}/toggle-actif`)
    };
}

/** Modes de règlement et partenaires commerciaux. */
export function commercialApi(client: SiraClient) {
    return {
        modesReglement: () => client.get<{ modesReglement: ModeReglement[] }>(`${BASE}/modes-reglement`),
        createModeReglement: (body: ModeReglementRequest) => client.post<{ modeReglement: ModeReglement }>(`${BASE}/modes-reglement`, { body }),
        updateModeReglement: (uuid: string, body: ModeReglementRequest) =>
            client.put<{ modeReglement: ModeReglement }>(`${BASE}/modes-reglement/${uuid}`, { body }),
        deleteModeReglement: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/modes-reglement/${uuid}`),
        toggleModeReglementActif: (uuid: string) => client.patch<{ modeReglement: ModeReglement }>(`${BASE}/modes-reglement/${uuid}/toggle-actif`),
        /** Convention backend : corps vide, valeurs en query params. */
        setFraisModeReglement: (uuid: string, fraisPourcentage: number, fraisFixe: number) =>
            client.patch<{ modeReglement: ModeReglement }>(`${BASE}/modes-reglement/${uuid}/frais`, { params: { fraisPourcentage, fraisFixe } }),

        partenaires: () => client.get<{ partenaires: Partenaire[] }>(`${BASE}/partenaires`),
        partenaireStats: () => client.get<Record<string, number>>(`${BASE}/partenaires/stats`),
        partenairesByStatut: (statut: string) => client.get<{ partenaires: Partenaire[] }>(`${BASE}/partenaires/statut/${statut}`),
        createPartenaire: (body: PartenaireRequest) => client.post<{ partenaire: Partenaire }>(`${BASE}/partenaires`, { body }),
        updatePartenaire: (uuid: string, body: PartenaireRequest) => client.put<{ partenaire: Partenaire }>(`${BASE}/partenaires/${uuid}`, { body }),
        deletePartenaire: (uuid: string) => client.delete<Record<string, never>>(`${BASE}/partenaires/${uuid}`),
        setCommissionsPartenaire: (uuid: string, commissionPourcentage: number, commissionFixe: number) =>
            client.patch<{ partenaire: Partenaire }>(`${BASE}/partenaires/${uuid}/commissions`, { params: { commissionPourcentage, commissionFixe } }),
        setStatutPartenaire: (uuid: string, statut: StatutPartenaire) =>
            client.patch<{ partenaire: Partenaire }>(`${BASE}/partenaires/${uuid}/statut`, { params: { statut } })
    };
}

/** Notifications in-app + enregistrement des tokens FCM (mobile). */
export function notificationApi(client: SiraClient) {
    return {
        list: () => client.get<{ notifications: unknown[] }>(`${BASE}/notifications`),
        registerDeviceToken: (token: string, platform: 'IOS' | 'ANDROID') =>
            client.post<Record<string, never>>(`${BASE}/device-tokens`, { body: { token, platform } })
    };
}
