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
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth-context';
import { BarreEmpilee, BarresHorizontales, type PartGraphique } from './Graphiques';
import { tagSeverity } from './shared';

type VehiculeAlerte = Vehicule & { alerte: string };

const LIBELLES_TYPE_PARTENAIRE = ['AGENCE', 'MICROFINANCE', 'COMMERCE', 'POINT_VENTE', 'TRANSPORTEUR', 'REVENDEUR', 'GUICHET', 'AUTRE'];

/** Carte d'indicateur clé : pastille icône, grande valeur, libellé, ligne de contexte. */
function Kpi({ icone, ton, valeur, libelle, contexte }: { icone: string; ton: 'vert' | 'or' | 'bleu' | 'gris'; valeur: number; libelle: string; contexte?: ReactNode }) {
    return (
        <article className={`kpi kpi-${ton}`}>
            <span className="kpi-icone" aria-hidden="true">
                <i className={`pi ${icone}`} />
            </span>
            <span className="kpi-valeur">{valeur}</span>
            <span className="kpi-libelle">{libelle}</span>
            {contexte && <span className="kpi-contexte">{contexte}</span>}
        </article>
    );
}

/** En-tête de bloc : titre + lien optionnel « voir tout ». */
function EnteteBloc({ titre, lien, libelleLien }: { titre: string; lien?: string; libelleLien?: string }) {
    return (
        <div className="dash-section-tete">
            <h2>{titre}</h2>
            {lien && (
                <Link to={lien} className="lien-discret">
                    {libelleLien ?? 'Voir tout'} <i className="pi pi-arrow-right" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

const DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function DashboardAdminPage() {
    const { user } = useAuth();
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
                    <h1>Bonjour{user?.firstName ? `, ${user.firstName}` : ''} 👋</h1>
                    <p className="muted">Voici l'activité du {DATE_LONGUE.format(new Date())}.</p>
                </div>
                <Button icon="pi pi-refresh" label="Actualiser" outlined size="small" loading={tableauQuery.isFetching} onClick={() => void tableauQuery.refetch()} />
            </div>

            <div className="kpi-grille">
                <Kpi
                    icone="pi-ticket"
                    ton="vert"
                    valeur={d.offres.ouvertes ?? 0}
                    libelle="Offres ouvertes"
                    contexte={
                        <>
                            {d.offres.total ?? 0} au total · <strong>{d.offres.aujourd_hui ?? 0}</strong> aujourd'hui
                        </>
                    }
                />
                <Kpi
                    icone="pi-car"
                    ton="bleu"
                    valeur={d.vehicules.actifs ?? 0}
                    libelle="Véhicules actifs"
                    contexte={
                        alertesVehicules.length > 0 ? (
                            <span className="texte-danger">{alertesVehicules.length} alerte(s) document</span>
                        ) : (
                            <>{d.vehicules.enMaintenance ?? 0} en maintenance</>
                        )
                    }
                />
                <Kpi
                    icone="pi-briefcase"
                    ton="or"
                    valeur={d.partenaires.actifs ?? 0}
                    libelle="Partenaires actifs"
                    contexte={
                        (d.partenaires.enAttente ?? 0) > 0 ? (
                            <span className="texte-danger">{d.partenaires.enAttente} en attente</span>
                        ) : (
                            <>Réseau de distribution</>
                        )
                    }
                />
                <Kpi icone="pi-directions" ton="gris" valeur={d.trajets.actifs ?? 0} libelle="Trajets actifs" contexte={<>{d.trajets.total ?? 0} trajets définis</>} />
            </div>

            <div className="bloc-duo">
                <div>
                    <EnteteBloc titre="Offres par statut" lien="/admin/offres" libelleLien="Gérer les offres" />
                    <BarreEmpilee parts={partsOffres} titre="Répartition des offres par statut" />
                </div>
                <div>
                    <EnteteBloc titre="Partenaires par type" lien="/admin/partenaires" libelleLien="Gérer" />
                    <BarresHorizontales parts={partsPartenaires} titre="Nombre de partenaires par type" />
                </div>
            </div>

            <EnteteBloc titre="Offres du jour" lien="/admin/offres" />
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

            <EnteteBloc titre="Alertes véhicules" lien="/admin/vehicules" libelleLien="Voir la flotte" />
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
                    <EnteteBloc titre="Partenaires en attente de validation" lien="/admin/partenaires" libelleLien="Gérer" />
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
