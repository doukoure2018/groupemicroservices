// Leads back-office (intermédiation Phase 1) — alignés sur LeadAdminView /
// LeadVisiteAdminView du backend immobilierservice.

export interface ILeadContact {
    contactId: number;
    contactUuid: string;
    proprieteId: number;
    demandeurUserId: number;
    nomDemandeur: string;
    telephoneDemandeur: string;
    emailDemandeur: string;
    message: string;
    typeDemande: string;
    statut: string;
    vuParVendeur: boolean;
    createdAt: string;
    leadStatut: string;
    noteAdmin: string | null;
    traitePar: number | null;
    traiteAt: string | null;
}

export interface ILeadVisite {
    visiteId: number;
    visiteUuid: string;
    proprieteId: number;
    visiteurUserId: number;
    dateVisite: string;
    heureVisite: string | null;
    statut: string;
    notesVisiteur: string | null;
    notesVendeur: string | null;
    motifAnnulation: string | null;
    createdAt: string;
    updatedAt: string;
    leadStatut: string;
    noteAdmin: string | null;
    traitePar: number | null;
    traiteAt: string | null;
}

export interface ILeadContactView {
    contact: ILeadContact;
    proprieteUuid: string;
    proprieteReference: string;
    proprieteTitre: string;
}

export interface ILeadVisiteView {
    visite: ILeadVisite;
    proprieteUuid: string;
    proprieteReference: string;
    proprieteTitre: string;
}

export interface ITraiterLeadRequest {
    action: 'TRAITE' | 'REJETE';
    noteAdmin?: string;
}
