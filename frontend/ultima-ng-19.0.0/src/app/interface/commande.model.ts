/** Commande de voyage (réservation) — miroir du domaine billetterieservice. */
export interface BilletClient {
    billetUuid?: string;
    codeBillet?: string;
    numeroSiege?: string;
    nomPassager?: string;
    telephonePassager?: string;
    pieceIdentite?: string;
    statut?: string;
    qrCodeData?: string;
}

export interface CommandeClient {
    commandeUuid?: string;
    numeroCommande?: string;
    statut?: string;
    nombrePlaces?: number;
    montantTotal?: number;
    montantPaye?: number;
    devise?: string;
    referencePaiement?: string;
    createdAt?: string;

    // Offre / trajet joints
    offreUuid?: string;
    dateDepart?: string;
    heureDepart?: string | number[];
    villeDepartLibelle?: string;
    villeArriveeLibelle?: string;
    siteDepart?: string;
    siteArrivee?: string;
    pointRencontre?: string;
    niveauRemplissage?: number;

    billets?: BilletClient[];
}

export interface PassagerRequest {
    nom: string;
    prenom: string;
    telephone: string;
    pieceIdentite?: string;
}

export interface CommandeCreateRequest {
    offreUuid: string;
    passagers: PassagerRequest[];
    modeReglementCode: string;
    montantTotal: number;
}
