import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type AgenceAdmin } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../api';
import { useNotif } from './admin/shared';

/** File des dossiers d'agence soumis à la conformité : approbation ou rejet motivé. */
export function ConformitePage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['conformite-dossiers'];

    const dossiersQuery = useQuery({
        queryKey: CLE,
        queryFn: async () => (await api.immo.agences.conformiteList({ limit: 50, offset: 0 })).data
    });

    const [rejetDe, setRejetDe] = useState<AgenceAdmin | null>(null);
    const [motif, setMotif] = useState('');
    const [rccmEnCours, setRccmEnCours] = useState<string | null>(null);

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    const approuver = useMutation({
        mutationFn: async (d: AgenceAdmin) => api.immo.agences.approuver(d.agenceUuid!),
        onSuccess: (res) => {
            succes('Agence approuvée', res.message);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'approbation a échoué.")
    });

    const rejeter = useMutation({
        mutationFn: async () => api.immo.agences.rejeterAgence(rejetDe!.agenceUuid!, { motif: motif.trim() }),
        onSuccess: (res) => {
            succes('Dossier rejeté', res.message);
            setRejetDe(null);
            setMotif('');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Le rejet a échoué.')
    });

    /**
     * Le document est servi par le backend derrière un JWT : on récupère un binaire
     * puis on ouvre une URL objet. Le lien MinIO direct refuserait l'en-tête d'autorisation.
     */
    async function ouvrirRccm(d: AgenceAdmin) {
        setRccmEnCours(d.agenceUuid ?? null);
        try {
            const blob = await api.immo.agences.conformiteRccm(d.agenceUuid!);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener');
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (err) {
            erreur(err, "Impossible d'ouvrir le document RCCM.");
        } finally {
            setRccmEnCours(null);
        }
    }

    function confirmerApprobation(d: AgenceAdmin) {
        confirmDialog({
            header: 'Approuver le dossier',
            icon: 'pi pi-check-circle',
            message: `Valider l'agence « ${d.nom} » (RCCM/NIF : ${d.numeroRegistre}) ? Un email de confirmation lui sera envoyé.`,
            acceptLabel: 'Approuver',
            rejectLabel: 'Annuler',
            accept: () => approuver.mutate(d)
        });
    }

    const dossiers = dossiersQuery.data?.agences ?? [];
    const total = dossiersQuery.data?.total ?? 0;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="admin-entete">
                <div>
                    <h1>Dossiers agence en attente de validation</h1>
                    <p className="muted">Vérifiez le document RCCM puis approuvez ou rejetez avec un motif</p>
                </div>
                <div className="cellule-actions">
                    <Tag value={`${total} en attente`} severity="warning" />
                    <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" loading={dossiersQuery.isFetching} onClick={() => void dossiersQuery.refetch()} />
                </div>
            </div>

            {dossiersQuery.isError && <p className="error">Impossible de charger les dossiers.</p>}

            <DataTable
                value={dossiers}
                loading={dossiersQuery.isLoading}
                paginator={dossiers.length > 20}
                rows={20}
                size="small"
                stripedRows
                emptyMessage="Aucun dossier en attente — la file est vide."
                scrollable
            >
                <Column
                    header="Agence"
                    body={(d: AgenceAdmin) => (
                        <div className="cellule-trajet">
                            <strong>{d.nom}</strong>
                            {d.raisonSociale && <span className="muted">{d.raisonSociale}</span>}
                        </div>
                    )}
                />
                <Column header="RCCM / NIF" body={(d: AgenceAdmin) => d.numeroRegistre ?? '—'} />
                <Column
                    header="Contact"
                    body={(d: AgenceAdmin) => (
                        <div className="cellule-trajet">
                            <span>{d.email}</span>
                            {d.telephone && <span className="muted">{d.telephone}</span>}
                            {d.telephoneWhatsapp && (
                                <span className="lien-whatsapp">
                                    <i className="pi pi-whatsapp" /> {d.telephoneWhatsapp}
                                </span>
                            )}
                        </div>
                    )}
                />
                <Column header="Adresse" body={(d: AgenceAdmin) => d.adresse ?? '—'} />
                <Column
                    header="Document"
                    body={(d: AgenceAdmin) =>
                        d.documentsKycUrl ? (
                            <Button icon="pi pi-file-pdf" label="RCCM" outlined size="small" loading={rccmEnCours === d.agenceUuid} onClick={() => void ouvrirRccm(d)} />
                        ) : (
                            <Tag value="Absent" severity="danger" />
                        )
                    }
                />
                <Column header="Soumis le" body={(d: AgenceAdmin) => formatDateFr(d.dateSoumissionConformite)} />
                <Column
                    header="Décision"
                    body={(d: AgenceAdmin) => (
                        <div className="cellule-actions">
                            <Button label="Approuver" icon="pi pi-check" severity="success" size="small" disabled={approuver.isPending} onClick={() => confirmerApprobation(d)} />
                            <Button
                                icon="pi pi-times"
                                severity="danger"
                                outlined
                                size="small"
                                tooltip="Rejeter avec motif"
                                disabled={approuver.isPending}
                                onClick={() => {
                                    setRejetDe(d);
                                    setMotif('');
                                }}
                            />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header="Rejeter le dossier" visible={!!rejetDe} style={{ width: 'min(480px, 95vw)' }} onHide={() => setRejetDe(null)} modal>
                <p>
                    Dossier : <strong>{rejetDe?.nom}</strong>
                </p>
                <label className="champ-plein">
                    Motif du rejet (envoyé par email à l'agence) *
                    <textarea rows={4} maxLength={500} value={motif} placeholder="Ex. : document RCCM illisible, numéro RCCM invalide…" onChange={(e) => setMotif(e.target.value)} />
                    <span className="muted">{motif.length} / 500 caractères</span>
                </label>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setRejetDe(null)} />
                    <Button label="Rejeter le dossier" icon="pi pi-times" severity="danger" disabled={!motif.trim() || rejeter.isPending} loading={rejeter.isPending} onClick={() => rejeter.mutate()} />
                </div>
            </Dialog>
        </section>
    );
}
