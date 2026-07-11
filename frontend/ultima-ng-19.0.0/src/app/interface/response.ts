import { IRole } from './role';
import { IUser } from './user';
import { IRegion } from './region';
import { IVille } from './ville';
import { ICommune } from './commune';
import { IQuartier } from './quartier';
import { ILocalisation, IPlacePrediction } from './localisation';

// Import des nouveaux models de billetterie
import { Site } from './site.model';
import { Depart } from './depart.model';
import { Arrivee } from './arrivee.model';
import { Trajet } from './trajet.model';
import { Offre } from './offre.model';
import { Vehicule } from './vehicule.model';
import { TypeVehicule } from './type-vehicule.model';
import { ModeReglement } from './mode-reglement.model';
import { Partenaire } from './partenaire.model';

// Immobilier (SIRA Guinée)
import { IPropriete } from './propriete';
import { ILeadContactView, ILeadVisiteView, IProprietaire } from './lead';

export interface IResponse {
    time: Date | string;
    code: number;
    status: string;
    message: string;
    path: string;
    exception: string;
    data: {
        // Users & Roles
        user?: IUser;
        users?: IUser[];
        role?: IRole;
        roles?: IRole[];

        // Géographie
        region?: IRegion;
        regions?: IRegion[];
        ville?: IVille;
        villes?: IVille[];
        commune?: ICommune;
        communes?: ICommune[];
        quartier?: IQuartier;
        quartiers?: IQuartier[];
        localisation?: ILocalisation;
        localisations?: ILocalisation[];

        // Billetterie - Sites, Départs, Arrivées
        site?: Site;
        sites?: Site[];
        depart?: Depart;
        departs?: Depart[];
        arrivee?: Arrivee;
        arrivees?: Arrivee[];

        // Billetterie - Trajets, Offres, Véhicules, Modes de règlement, Partenaires
        trajet?: Trajet;
        trajets?: Trajet[];
        offre?: Offre;
        offres?: Offre[];
        vehicule?: Vehicule;
        vehicules?: Vehicule[];
        typeVehicule?: TypeVehicule;
        typesVehicules?: TypeVehicule[];
        modeReglement?: ModeReglement;
        modesReglement?: ModeReglement[];
        partenaire?: Partenaire;
        partenaires?: Partenaire[];

        // Statistiques (offres, véhicules, trajets)
        actifs?: number;
        inactifs?: number;
        enMaintenance?: number;
        suspendus?: number;
        enAttente?: number;
        enCours?: number;
        ouvertes?: number;
        fermees?: number;
        terminees?: number;
        annulees?: number;
        suspendues?: number;
        aujourd_hui?: number;

        // Calculs de frais / commissions
        montant?: number;
        frais?: number;
        montantBrut?: number;
        montantNet?: number;
        commission?: number;

        // Immobilier (SIRA Guinée)
        propriete?: IPropriete;
        proprietes?: IPropriete[];
        vendeur?: any;
        // Onboarding agence (V31) + écran admin agences
        agence?: any;
        agences?: any[];
        representantNom?: string;
        agents?: any[];
        annonces?: any[];
        // Demandes de besoin clients (V32)
        demande?: any;
        demandes?: any[];
        scope?: string;
        // Leads back-office (intermédiation)
        contacts?: ILeadContactView[];
        visites?: ILeadVisiteView[];
        proprietaire?: IProprietaire;
        statut?: string;
        limit?: number;
        offset?: number;

        // Métadonnées
        total?: number;
        regionUuid?: string;
        villeUuid?: string;
        communeUuid?: string;
        quartierUuid?: string;
        searchTerm?: string;

        // Google Places / OpenStreetMap proxy responses
        predictions?: IPlacePrediction[];
        place?: {
            address?: string;
            latitude?: number;
            longitude?: number;
        };
        address?: string;
    };
}
