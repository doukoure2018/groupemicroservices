import { useQuery } from '@tanstack/react-query';
import {
    formatDateFr,
    formatHeure,
    formatMontant,
    getStatutOffreLabel,
    getStatutOffreSeverity,
    getStatutVehiculeLabel,
    getStatutVehiculeSeverity,
    getTypePartenaireLabel,
    type Offre,
    type Partenaire,
    type Vehicule
} from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Tag } from 'primereact/tag';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { BarreEmpilee, BarresHorizontales, type PartGraphique } from './Graphiques';
import { StatCarte, tagSeverity } from './shared';

type VehiculeAlerte = Vehicule & { alerte: string };

const LIBELLES_TYPE_PARTENAIRE = ['AGENCE', 'MICROFINANCE', 'COMMERCE', 'POINT_VENTE', 'TRANSPORTEUR', 'REVENDEUR', 'GUICHET', 'AUTRE'];

export function DashboardAdminPage() {
    const tableauQuery = useQuery({
        queryKey: ['dashboard-admin'],
        queryFn: async () => {
            const [offreStats, vehiculeStats, partenaireStats, trajetStats, offresJour, assurances, visites, partenairesAttente, typesPartenaires] = await Promise.all([
                api.offres.stats(),
                api.vehicules.stats(),
                api.commercial.partenaireStats(),
                api.transport.trajetStats(),
                api.offres.aujourdHui(),
                api.vehicules.assurancesExpirees(),
                api.vehicules.visitesExpirees(),
                api.commercial.partenairesByStatut('EN_ATTENTE'),
                api.commercial.partenaireStatsByType()
            ]);
            return {
                offres: offreStats.data,
                vehicules: vehiculeStats.data,
                partenaires: partenaireStats.data,
                trajets: trajetStats.data,
                offresJour: offresJour.data.offres ?? [],
                assurances: assurances.data.vehicules ?? [],
                visites: visites.data.vehicules ?? [],
                partenairesAttente: partenairesAttente.data.partenaires ?? [],
                typesPartenaires: typesPartenaires.data
            };
        }
    });

    const d = tableauQuery.data;

    /** Un véhicule cumulant les deux expirations ne doit apparaître qu'une fois. */
    const alertesVehicules = useMemo<VehiculeAlerte[]>(() => {
        if (!d) return [];
        const parUuid = new Map<string, VehiculeAlerte>();
        for (const v of d.assurances) parUuid.set(v.vehiculeUuid!, { ...v, alerte: 'Assurance expirée' });
        for (const v of d.visites) {
            const existant = parUuid.get(v.vehiculeUuid!);
            if (existant) existant.alerte = 'Assurance + visite expirées';
            else parUuid.set(v.vehiculeUuid!, { ...v, alerte: 'Visite technique expirée' });
        }
        return [...parUuid.values()];
    }, [d]);

    const partsOffres = useMemo<PartGraphique[]>(() => {
        const o = d?.offres;
        if (!o) return [];
        return [
            { libelle: 'Ouvertes', valeur: o.ouvertes ?? 0 },
            { libelle: 'En attente', valeur: o.enAttente ?? 0 },
            { libelle: 'En cours', valeur: o.enCours ?? 0 },
            { libelle: 'Terminées', valeur: o.terminees ?? 0 },
            { libelle: 'Fermées', valeur: o.fermees ?? 0 },
            { libelle: 'Annulées', valeur: o.annulees ?? 0 },
            { libelle: 'Suspendues', valeur: o.suspendues ?? 0 }
        ];
    }, [d]);

    const partsPartenaires = useMemo<PartGraphique[]>(() => {
        const stats = d?.typesPartenaires ?? {};
        return LIBELLES_TYPE_PARTENAIRE.map((code) => ({ libelle: getTypePartenaireLabel(code), valeur: Number(stats[code] ?? 0) })).filter((p) => p.valeur > 0);
    }, [d]);

    if (tableauQuery.isPending) return <p className="muted center">Chargement du tableau de bord…</p>;
    if (tableauQuery.isError || !d) {
        return (
            <section className="card card-large">
                <p className="error">Impossible de charger le tableau de bord.</p>
                <Button label="Réessayer" icon="pi pi-refresh" onClick={() => void tableauQuery.refetch()} />
            </section>
        );
    }

    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>Tableau de bord</h1>
                    <p className="muted">Activité du jour et points d'attention</p>
                </div>
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" loading={tableauQuery.isFetching} onClick={() => void tableauQuery.refetch()} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Offres ouvertes" valeur={d.offres.ouvertes ?? 0} ton="succes" />
                <StatCarte libelle="Véhicules actifs" valeur={d.vehicules.actifs ?? 0} ton="succes" />
                <StatCarte libelle="Partenaires actifs" valeur={d.partenaires.actifs ?? 0} />
                <StatCarte libelle="Trajets actifs" valeur={d.trajets.actifs ?? 0} />
            </div>

            <p className="muted ligne-metriques">
                <span>{d.offres.total ?? 0} offres au total</span>
                <span>{d.offres.aujourd_hui ?? 0} aujourd'hui</span>
                <span>{d.vehicules.enMaintenance ?? 0} véhicules en maintenance</span>
                {alertesVehicules.length > 0 && <span className="texte-danger">{alertesVehicules.length} alerte(s) véhicule</span>}
                {(d.partenaires.enAttente ?? 0) > 0 && <span className="texte-danger">{d.partenaires.enAttente} partenaire(s) en attente</span>}
            </p>

            <div className="duo-graphiques">
                <div>
                    <h2 className="section-titre">Offres par statut</h2>
                    <BarreEmpilee parts={partsOffres} titre="Répartition des offres par statut" />
                </div>
                <div>
                    <h2 className="section-titre">Partenaires par type</h2>
                    <BarresHorizontales parts={partsPartenaires} titre="Nombre de partenaires par type" />
                </div>
            </div>

            <div className="admin-entete">
                <h2 className="section-titre">Offres du jour</h2>
                <Link to="/admin/offres" className="lien-discret">
                    Voir tout
                </Link>
            </div>
            <DataTable value={d.offresJour} paginator={d.offresJour.length > 5} rows={5} size="small" stripedRows emptyMessage="Aucune offre aujourd'hui" scrollable>
                <Column
                    header="Trajet"
                    body={(o: Offre) => (
                        <div className="cellule-trajet">
                            <strong>{o.villeDepartLibelle}</strong>
                            <span className="muted">vers {o.villeArriveeLibelle}</span>
                        </div>
                    )}
                />
                <Column header="Heure" body={(o: Offre) => formatHeure(o.heureDepart)} />
                <Column
                    header="Places"
                    body={(o: Offre) => {
                        const total = o.nombrePlacesTotal ?? 0;
                        const taux = total ? Math.round(((o.nombrePlacesReservees ?? 0) / total) * 100) : 0;
                        return (
                            <div className="cellule-trajet">
                                <span>
                                    {o.nombrePlacesDisponibles ?? 0} / {total}
                                </span>
                                <span className="muted">{taux}% rempli</span>
                            </div>
                        );
                    }}
                />
                <Column header="Prix" body={(o: Offre) => formatMontant(o.montant, o.devise)} />
                <Column header="Statut" body={(o: Offre) => <Tag value={getStatutOffreLabel(o.statut)} severity={tagSeverity(getStatutOffreSeverity(o.statut))} />} />
            </DataTable>

            <div className="admin-entete">
                <h2 className="section-titre">Alertes véhicules</h2>
                <Link to="/admin/vehicules" className="lien-discret">
                    Voir la flotte
                </Link>
            </div>
            <DataTable value={alertesVehicules} paginator={alertesVehicules.length > 5} rows={5} size="small" stripedRows emptyMessage="Aucune alerte" scrollable>
                <Column
                    header="Véhicule"
                    body={(v: VehiculeAlerte) => (
                        <div className="cellule-trajet">
                            <strong>{v.immatriculation}</strong>
                            <span className="muted">
                                {v.marque} {v.modele}
                            </span>
                        </div>
                    )}
                />
                <Column header="Alerte" body={(v: VehiculeAlerte) => <Tag value={v.alerte} severity="danger" />} />
                <Column header="Statut" body={(v: VehiculeAlerte) => <Tag value={getStatutVehiculeLabel(v.statut)} severity={tagSeverity(getStatutVehiculeSeverity(v.statut))} />} />
            </DataTable>

            {d.partenairesAttente.length > 0 && (
                <>
                    <div className="admin-entete">
                        <h2 className="section-titre">Partenaires en attente de validation</h2>
                        <Link to="/admin/partenaires" className="lien-discret">
                            Gérer
                        </Link>
                    </div>
                    <DataTable value={d.partenairesAttente} paginator={d.partenairesAttente.length > 5} rows={5} size="small" stripedRows scrollable>
                        <Column header="Nom" body={(p: Partenaire) => <strong>{p.nom}</strong>} />
                        <Column header="Type" body={(p: Partenaire) => <Tag value={getTypePartenaireLabel(p.typePartenaire)} severity="info" />} />
                        <Column header="Téléphone" body={(p: Partenaire) => p.telephone || '-'} />
                        <Column header="Ville" body={(p: Partenaire) => p.villeLibelle || '-'} />
                        <Column header="Responsable" body={(p: Partenaire) => p.responsableNom || '-'} />
                        <Column header="Début partenariat" body={(p: Partenaire) => formatDateFr(p.dateDebutPartenariat)} />
                    </DataTable>
                </>
            )}
        </section>
    );
}
