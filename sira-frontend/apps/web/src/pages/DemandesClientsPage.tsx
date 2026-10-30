import { ApiError } from '@sira/api-client';
import { useQuery } from '@tanstack/react-query';
import { formatDateFr, type DemandeBesoin, type ScopeDemandes } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { useState } from 'react';
import { api } from '../api';

const SCOPES: { label: string; value: ScopeDemandes }[] = [
    { label: 'Ma zone', value: 'ZONE' },
    { label: 'Toutes les zones', value: 'TOUTES' }
];

/** Retire tout sauf les chiffres : c'est le format attendu par les liens WhatsApp. */
function numeroWhatsapp(brut: string): string {
    return brut.replace(/[^0-9]/g, '');
}

function formatBudget(d: DemandeBesoin): string | null {
    if (d.budgetMin == null && d.budgetMax == null) return null;
    const fmt = (v: number | undefined) => (v == null ? '—' : v.toLocaleString('fr-GN'));
    return `${fmt(d.budgetMin)} à ${fmt(d.budgetMax)} ${d.devise ?? 'GNF'}`;
}

export function DemandesClientsPage() {
    const [scope, setScope] = useState<ScopeDemandes>('ZONE');

    const demandesQuery = useQuery({
        queryKey: ['demandes-clients', scope],
        queryFn: async () => (await api.immo.clientSide.mesDemandes({ scope, limit: 50, offset: 0 })).data,
        retry: false
    });

    const demandes = demandesQuery.data?.demandes ?? [];
    const total = demandesQuery.data?.total ?? 0;
    // Le backend renvoie un 403 explicite tant que l'agence n'est pas validée.
    const messageAcces = demandesQuery.isError
        ? demandesQuery.error instanceof ApiError
            ? demandesQuery.error.message
            : 'Impossible de charger les demandes.'
        : null;

    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>Demandes clients</h1>
                    <p className="muted">Besoins déclarés par les clients, filtrés sur la zone de votre agence</p>
                </div>
                <div className="cellule-actions">
                    <SelectButton value={scope} options={SCOPES} onChange={(e) => e.value && setScope(e.value as ScopeDemandes)} allowEmpty={false} />
                    {!messageAcces && <Tag value={`${total} demande(s)`} severity="info" />}
                    <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" loading={demandesQuery.isFetching} onClick={() => void demandesQuery.refetch()} />
                </div>
            </div>

            {messageAcces ? (
                <div className="bloc-acces-refuse">
                    <i className="pi pi-lock grand-icone" />
                    <p>{messageAcces}</p>
                </div>
            ) : (
                <DataTable
                    value={demandes}
                    loading={demandesQuery.isLoading}
                    paginator={demandes.length > 20}
                    rows={20}
                    size="small"
                    stripedRows
                    emptyMessage={scope === 'ZONE' ? 'Aucune demande dans votre zone pour le moment.' : 'Aucune demande active.'}
                    scrollable
                >
                    <Column header="Référence" body={(d: DemandeBesoin) => <span className="sans-retour">{d.reference}</span>} />
                    <Column
                        header="Recherche"
                        body={(d: DemandeBesoin) => (
                            <div className="cellule-trajet">
                                <strong>{d.typeBienLibelle || 'Bien immobilier'}</strong>
                                <span>
                                    <Tag value={d.typeAnnonce === 'LOCATION' ? 'Location' : 'Achat'} severity={d.typeAnnonce === 'LOCATION' ? 'info' : 'warning'} />
                                </span>
                                {d.nbChambresMin != null && <span className="muted">{d.nbChambresMin}+ chambres</span>}
                            </div>
                        )}
                    />
                    <Column
                        header="Zone"
                        body={(d: DemandeBesoin) => (
                            <div className="cellule-trajet">
                                <span>{[d.quartierLibelle, d.communeLibelle].filter(Boolean).join(', ') || '—'}</span>
                                {d.regionLibelle && <span className="muted">{d.regionLibelle}</span>}
                            </div>
                        )}
                    />
                    <Column header="Budget" body={(d: DemandeBesoin) => formatBudget(d) ?? <span className="muted">Non précisé</span>} />
                    <Column header="Précisions" body={(d: DemandeBesoin) => <span className="deux-lignes" title={d.description}>{d.description || '—'}</span>} />
                    <Column
                        header="Contacter le client"
                        body={(d: DemandeBesoin) => (
                            <div className="cellule-trajet">
                                {d.contactTelephone && (
                                    <a href={`tel:${d.contactTelephone}`}>
                                        <i className="pi pi-phone" /> {d.contactTelephone}
                                    </a>
                                )}
                                {d.contactWhatsapp && (
                                    <a href={`https://wa.me/${numeroWhatsapp(d.contactWhatsapp)}`} target="_blank" rel="noopener noreferrer" className="lien-whatsapp">
                                        <i className="pi pi-whatsapp" /> {d.contactWhatsapp}
                                    </a>
                                )}
                                {!d.contactTelephone && !d.contactWhatsapp && <span className="muted">—</span>}
                            </div>
                        )}
                    />
                    <Column header="Reçue le" body={(d: DemandeBesoin) => formatDateFr(d.createdAt)} />
                </DataTable>
            )}
        </section>
    );
}
