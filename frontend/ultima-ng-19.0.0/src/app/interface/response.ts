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
