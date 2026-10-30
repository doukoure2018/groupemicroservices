import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEVISES, formatDistance, formatDuree, formatMontant, type Trajet, type TrajetRequest } from '@sira/core';
import { ApiError } from '@sira/api-client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useRef, useState } from 'react';
import { api } from '../../api';

interface TrajetForm {
    departUuid: string;
    arriveeUuid: string;
    libelleTrajet: string;
    description: string;
    distanceKm: string;
    dureeEstimeeMinutes: string;
    montantBase: string;
    montantBagages: string;
    devise: string;
}

const FORM_VIDE: TrajetForm = {
    departUuid: '',
    arriveeUuid: '',
    libelleTrajet: '',
    description: '',
    distanceKm: '',
    dureeEstimeeMinutes: '',
    montantBase: '',
    montantBagages: '',
    devise: 'GNF'
};

export function TrajetsAdminPage() {
    const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();

    const trajetsQuery = useQuery({
        queryKey: ['admin-trajets'],
        queryFn: async () => (await api.transport.trajets()).data.trajets
    });

    const departsQuery = useQuery({
        queryKey: ['admin-departs'],
        queryFn: async () => (await api.transport.departs()).data.departs
    });

    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Trajet | null>(null);
    const [form, setForm] = useState<TrajetForm>(FORM_VIDE);

    // Les arrivées dépendent du point de départ choisi (modèle backend : une arrivée est liée à un départ).
    const arriveesQuery = useQuery({
        queryKey: ['arrivees-du-depart', form.departUuid],
        queryFn: async () => (await api.transport.arriveesByDepart(form.departUuid)).data.arrivees,
        enabled: dialogOuvert && !!form.departUuid
    });

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['admin-trajets'] });
    const notifErreur = (err: unknown, fallback: string) =>
        toast.current?.show({ severity: 'error', summary: 'Échec', detail: err instanceof ApiError ? err.message : fallback, life: 6000 });

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: TrajetRequest = {
                departUuid: form.departUuid,
                arriveeUuid: form.arriveeUuid,
                libelleTrajet: form.libelleTrajet || undefined,
                description: form.description || undefined,
                distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
                dureeEstimeeMinutes: form.dureeEstimeeMinutes ? Number(form.dureeEstimeeMinutes) : undefined,
                montantBase: form.montantBase ? Number(form.montantBase) : undefined,
                montantBagages: form.montantBagages ? Number(form.montantBagages) : undefined,
                devise: form.devise
            };
            return enEdition ? api.transport.updateTrajet(enEdition.trajetUuid!, body) : api.transport.createTrajet(body);
        },
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: enEdition ? 'Trajet modifié' : 'Trajet créé' });
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => notifErreur(err, "L'enregistrement du trajet a échoué.")
    });

    const toggleActif = useMutation({
        mutationFn: async (trajet: Trajet) => api.transport.toggleTrajetActif(trajet.trajetUuid!),
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: 'Trajet mis à jour' });
            rafraichir();
        },
        onError: (err) => notifErreur(err, 'Impossible de changer le statut du trajet.')
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(t: Trajet) {
        setEnEdition(t);
        setForm({
            departUuid: t.departUuid ?? '',
            arriveeUuid: t.arriveeUuid ?? '',
            libelleTrajet: t.libelleTrajet ?? '',
            description: t.description ?? '',
            distanceKm: String(t.distanceKm ?? ''),
            dureeEstimeeMinutes: String(t.dureeEstimeeMinutes ?? ''),
            montantBase: String(t.montantBase ?? ''),
            montantBagages: String(t.montantBagages ?? ''),
            devise: t.devise ?? 'GNF'
        });
        setDialogOuvert(true);
    }

    const departsOptions = useMemo(
        () =>
            (departsQuery.data ?? []).map((d) => ({
                label: `${d.libelle} — ${d.siteNom ?? ''} (${d.villeLibelle ?? '?'})`,
                value: d.departUuid
            })),
        [departsQuery.data]
    );

    const arriveesOptions = useMemo(
        () =>
            (arriveesQuery.data ?? []).map((a) => ({
                label: `${a.libelle} — ${a.siteNom ?? ''} (${a.villeLibelle ?? '?'})`,
                value: a.arriveeUuid
            })),
        [arriveesQuery.data]
    );

    const formValide = form.departUuid && form.arriveeUuid;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Trajets</h1>
                <Button label="Nouveau trajet" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            {trajetsQuery.isError && <p className="error">Impossible de charger les trajets.</p>}

            <DataTable
                value={trajetsQuery.data ?? []}
                loading={trajetsQuery.isLoading}
                paginator
                rows={10}
                emptyMessage="Aucun trajet. Créez d'abord vos sites, départs et arrivées."
                size="small"
                stripedRows
            >
                <Column
                    header="Trajet"
                    body={(t: Trajet) => (
                        <div className="cellule-trajet">
                            <strong>
                                {t.departVilleLibelle ?? t.departLibelle} → {t.arriveeVilleLibelle ?? t.arriveeLibelle}
                            </strong>
                            <span className="muted">{t.libelleTrajet ?? `${t.departSiteNom ?? ''} → ${t.arriveeSiteNom ?? ''}`}</span>
                        </div>
                    )}
                />
                <Column header="Distance" body={(t: Trajet) => formatDistance(t.distanceKm)} />
                <Column header="Durée estimée" body={(t: Trajet) => formatDuree(t.dureeEstimeeMinutes)} />
                <Column
                    header="Montants"
                    body={(t: Trajet) => (
                        <div className="cellule-trajet">
                            <span>{formatMontant(t.montantBase, t.devise)}</span>
                            {t.montantBagages ? <span className="muted">Bagages : {formatMontant(t.montantBagages, t.devise)}</span> : null}
                        </div>
                    )}
                />
                <Column header="Statut" body={(t: Trajet) => <Tag value={t.actif ? 'Actif' : 'Inactif'} severity={t.actif ? 'success' : 'secondary'} />} />
                <Column
                    header="Actions"
                    body={(t: Trajet) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(t)} />
                            <Button
                                icon="pi pi-power-off"
                                rounded
                                text
                                severity={t.actif ? 'danger' : 'success'}
                                tooltip={t.actif ? 'Désactiver' : 'Activer'}
                                disabled={toggleActif.isPending}
                                onClick={() => toggleActif.mutate(t)}
                            />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog
                header={enEdition ? 'Modifier le trajet' : 'Nouveau trajet'}
                visible={dialogOuvert}
                style={{ width: 'min(640px, 95vw)' }}
                onHide={() => setDialogOuvert(false)}
                modal
            >
                <div className="form-grid">
                    <label className="span-2">
                        Point de départ *
                        <Dropdown
                            value={form.departUuid}
                            options={departsOptions}
                            onChange={(e) => setForm({ ...form, departUuid: e.value, arriveeUuid: '' })}
                            placeholder="Choisir un point de départ"
                            filter
                            loading={departsQuery.isLoading}
                        />
                    </label>
                    <label className="span-2">
                        Point d'arrivée *
                        <Dropdown
                            value={form.arriveeUuid}
                            options={arriveesOptions}
                            onChange={(e) => setForm({ ...form, arriveeUuid: e.value })}
                            placeholder={form.departUuid ? "Choisir un point d'arrivée" : "Choisissez d'abord le départ"}
                            filter
                            disabled={!form.departUuid}
                            loading={arriveesQuery.isLoading}
                            emptyMessage="Aucune arrivée définie pour ce départ."
                        />
                    </label>
                    <label className="span-2">
                        Libellé du trajet
                        <input placeholder="ex. Conakry → Kankan express" value={form.libelleTrajet} onChange={(e) => setForm({ ...form, libelleTrajet: e.target.value })} />
                    </label>
                    <label>
                        Distance (km)
                        <input type="number" min={0} step={0.1} value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
                    </label>
                    <label>
                        Durée estimée (minutes)
                        <input
                            type="number"
                            min={0}
                            value={form.dureeEstimeeMinutes}
                            onChange={(e) => setForm({ ...form, dureeEstimeeMinutes: e.target.value })}
                        />
                    </label>
                    <label>
                        Montant de base
                        <input type="number" min={0} step={1000} value={form.montantBase} onChange={(e) => setForm({ ...form, montantBase: e.target.value })} />
                    </label>
                    <label>
                        Montant bagages
                        <input type="number" min={0} step={1000} value={form.montantBagages} onChange={(e) => setForm({ ...form, montantBagages: e.target.value })} />
                    </label>
                    <label>
                        Devise
                        <Dropdown
                            value={form.devise}
                            options={DEVISES.map((d) => ({ label: d.label, value: d.value }))}
                            onChange={(e) => setForm({ ...form, devise: e.value })}
                        />
                    </label>
                    <label className="span-2">
                        Description
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button
                        label={sauvegarder.isPending ? 'Enregistrement…' : 'Enregistrer'}
                        icon="pi pi-check"
                        disabled={!formValide || sauvegarder.isPending}
                        onClick={() => sauvegarder.mutate()}
                    />
                </div>
            </Dialog>
        </section>
    );
}
