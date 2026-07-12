import { Observable } from 'rxjs';

/**
 * Configuration du composant générique de référentiel (ReferentielCrudComponent).
 * Utilisé par les écrans régions / villes / communes / quartiers (dette T12c) :
 * chaque écran ne déclare plus que sa config + un adaptateur vers son service.
 */

export interface ColonneRef {
    /** Propriété de la ligne à afficher */
    key: string;
    header: string;
    /** text (défaut) | badge (pastille grise, ex: code) | date (dd/MM/yyyy HH:mm) */
    type?: 'text' | 'badge' | 'date';
    /** Petite ligne secondaire sous la valeur (ex: région sous la ville) */
    subKey?: string;
    /** Icône affichée devant la valeur (colonne principale) */
    icon?: string;
}

export interface ChampRef {
    key: string;
    label: string;
    type: 'text' | 'dropdown';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
    /** dropdown : clé du registre d'options fourni par l'écran parent */
    optionsKey?: string;
    optionLabel?: string;
    optionValue?: string;
    /** dropdown : filtre les options selon la valeur d'un autre champ (cascade) */
    dependsOn?: { champ: string; matchKey: string };
    /** true = champ d'aide non envoyé au backend (ex: la ville des quartiers) */
    exclu?: boolean;
}

export interface FiltreRef {
    label: string;
    /** Propriété de la ligne comparée à la valeur du filtre */
    rowKey: string;
    optionsKey: string;
    optionLabel: string;
    optionValue: string;
    /** Cascade entre filtres : index du filtre parent + clé de correspondance sur l'option */
    dependsOn?: { filtre: number; matchKey: string };
}

export interface ReferentielCrudConfig {
    titre: string;
    sousTitre: string;
    /** « région », « quartier »… (minuscule) */
    entite: string;
    entitePluriel: string;
    genre: 'f' | 'm';
    /** Icône de la colonne principale et de la carte Total */
    icone: string;
    /** Clé UUID des lignes (ex: 'regionUuid') */
    uuidKey: string;
    colonnes: ColonneRef[];
    champs: ChampRef[];
    filtres?: FiltreRef[];
    /** Clés des lignes parcourues par la recherche texte */
    rechercheKeys: string[];
    largeurModal?: string;
    /**
     * Active le bouton « Ajout en lot » : les champs dropdown du formulaire +
     * un textarea « un libellé par ligne » ; chaque ligne devient un POST de
     * création (les doublons signalés par le backend sont ignorés).
     */
    saisieParLot?: boolean;
}

/** Résultat d'une ligne lors d'une saisie en lot. */
export interface LigneLot {
    libelle: string;
    statut: 'attente' | 'cree' | 'ignore' | 'erreur';
    detail?: string;
}

/** Résultat normalisé des mutations (l'adaptateur extrait l'entité de IResponse). */
export interface ResultatMutation {
    item: any;
    message: string;
}

/** Adaptateur vers le service HTTP de l'entité — routes et payloads inchangés. */
export interface ReferentielApi {
    getAll(): Observable<any[]>;
    create(payload: any): Observable<ResultatMutation>;
    update(uuid: string, payload: any): Observable<ResultatMutation>;
    updateStatus(uuid: string, actif: boolean): Observable<ResultatMutation>;
}
