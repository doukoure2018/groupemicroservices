import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDateFr, getStatutAgenceLabel, getStatutAgenceSeverity, type AgenceAdmin, type AgenceAgent, type AgenceAnnonce } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../../api';
import { StatCarte, tagSeverity, useNotif } from './shared';

interface DetailAgence {
    agence: AgenceAdmin;
    representantNom: string;
    agents: AgenceAgent[];
    annonces: AgenceAnnonce[];
}

export function AgencesAdminPage() {
    const { toast, erreur } = useNotif();

    const agencesQuery = useQuery({
        queryKey: ['admin-agences'],
        queryFn: async () => (await api.immo.agences.adminList({ limit: 50, offset: 0 })).data
    });

    const [detail, setDetail] = useState<DetailAgence | null>(null);

    const chargerDetail = useMutation({
        mutationFn: async (a: AgenceAdmin) => {
            const res = await api.immo.agences.adminActivites(a.agenceUuid!);
            return {
                agence: res.data.agence ?? a,
                representantNom: res.data.representantNom ?? a.representantNom ?? '',
                agents: res.data.agents ?? [],
                annonces: res.data.annonces ?? []
            } satisfies DetailAgence;
        },
        onSuccess: (d) => setDetail(d),
        onError: (err) => erreur(err, "Impossible de charger le détail de l'agence.")
    });

    /** Ouverture optimiste : la ligne du tableau s'affiche pendant le chargement du détail. */
    function ouvrirDetail(a: AgenceAdmin) {
        setDetail({ agence: a, representantNom: a.representantNom ?? '', agents: [], annonces: [] });
        chargerDetail.mutate(a);
    }

    const agences = agencesQuery.data?.agences ?? [];
    const total = agencesQuery.data?.total ?? 0;
    const verifiees = agences.filter((a) => a.statutVerification === 'VERIFIE').length;
    const enValidation = agences.filter((a) => a.statutVerification === 'EN_VALIDATION').length;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Agences immobilières</h1>
                    <p className="muted">Synthèse des agences, de leurs agents et de leurs annonces</p>
                </div>
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" loading={agencesQuery.isFetching} onClick={() => void agencesQuery.refetch()} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Agences" valeur={total} />
                <StatCarte libelle="Vérifiées" valeur={verifiees} ton="succes" />
                <StatCarte libelle="En validation" valeur={enValidation} ton="alerte" />
            </div>

            {agencesQuery.isError && <p className="error">Impossible de charger les agences.</p>}

            <DataTable value={agences} loading={agencesQuery.isLoading} paginator={agences.length > 20} rows={20} size="small" stripedRows emptyMessage="Aucune agence enregistrée." scrollable>
                <Column
                    header="Agence"
                    body={(a: AgenceAdmin) => (
                        <div className="cellule-trajet">
                            <strong>{a.nom}</strong>
                            {a.numeroRegistre && <span className="muted">{a.numeroRegistre}</span>}
                        </div>
                    )}
                />
                <Column header="Représentant" body={(a: AgenceAdmin) => a.representantNom || '—'} />
                <Column header="Zone" body={(a: AgenceAdmin) => (a.communeLibelle ? [a.communeLibelle, a.regionLibelle].filter(Boolean).join(', ') : '—')} />
                <Column header="Statut" body={(a: AgenceAdmin) => <Tag value={getStatutAgenceLabel(a.statutVerification)} severity={tagSeverity(getStatutAgenceSeverity(a.statutVerification))} />} />
                <Column
                    header="Annonces"
                    body={(a: AgenceAdmin) => (
                        <span>
                            <strong>{a.nbAnnoncesPubliees ?? 0}</strong> <span className="muted">/ {a.nbAnnoncesTotal ?? 0}</span>
                        </span>
                    )}
                />
                <Column header="Agents" body={(a: AgenceAdmin) => a.nbAgents ?? 0} />
                <Column header="Inscrite le" body={(a: AgenceAdmin) => formatDateFr(a.createdAt)} />
                <Column header="" body={(a: AgenceAdmin) => <Button label="Détail" icon="pi pi-eye" size="small" outlined onClick={() => ouvrirDetail(a)} />} />
            </DataTable>

            <Dialog header={detail?.agence.nom ?? 'Agence'} visible={!!detail} style={{ width: 'min(840px, 95vw)' }} onHide={() => setDetail(null)} modal dismissableMask>
                {detail && (
                    <>
                        <dl className="recap">
                            <dt>Représentant</dt>
                            <dd>
                                <strong>{detail.representantNom || '—'}</strong>
                            </dd>
                            <dt>RCCM / NIF</dt>
                            <dd>{detail.agence.numeroRegistre || '—'}</dd>
                            <dt>Email</dt>
                            <dd>{detail.agence.email || '—'}</dd>
                            <dt>Téléphone</dt>
                            <dd>{detail.agence.telephone || '—'}</dd>
                            <dt>Statut</dt>
                            <dd>
                                <Tag value={getStatutAgenceLabel(detail.agence.statutVerification)} severity={tagSeverity(getStatutAgenceSeverity(detail.agence.statutVerification))} />
                            </dd>
                            <dt>Adresse</dt>
                            <dd>{detail.agence.adresse || '—'}</dd>
                        </dl>

                        <h3 className="section-titre">Agents ({detail.agents.length})</h3>
                        {detail.agents.length ? (
                            <ul className="liste-simple">
                                {detail.agents.map((ag) => (
                                    <li key={ag.profilUuid}>{ag.bio || ag.typeProfil || 'Agent'}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="muted">{chargerDetail.isPending ? 'Chargement…' : 'Aucun agent.'}</p>
                        )}

                        <h3 className="section-titre">Annonces ({detail.annonces.length})</h3>
                        {detail.annonces.length ? (
                            <DataTable value={detail.annonces} paginator={detail.annonces.length > 5} rows={5} size="small" stripedRows>
                                <Column header="Référence" field="reference" />
                                <Column header="Titre" field="titre" />
                                <Column header="Type" body={(p: AgenceAnnonce) => <Tag value={p.typeAnnonce} severity={p.typeAnnonce === 'LOCATION' ? 'info' : 'warning'} />} />
                                <Column header="Statut" field="statut" />
                            </DataTable>
                        ) : (
                            <p className="muted">{chargerDetail.isPending ? 'Chargement…' : 'Aucune annonce.'}</p>
                        )}
                    </>
                )}
            </Dialog>
        </section>
    );
}
