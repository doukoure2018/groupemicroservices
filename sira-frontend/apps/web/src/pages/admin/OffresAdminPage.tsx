import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    DEVISES,
    formatDateFr,
    formatHeure,
    formatMontant,
    getStatutOffreLabel,
    getStatutOffreSeverity,
    getTauxRemplissage,
    hasPromotion,
    hasRole,
    type Offre,
    type OffreRequest
} from '@sira/core';
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
import { useAuth } from '../../auth-context';

/** Transitions proposées par statut — le backend reste le juge final. */
const TRANSITIONS: Record<string, { action: TransitionAction; label: string; icon: string; severity?: 'danger' | 'warning' | 'success' }[]> = {
    EN_ATTENTE: [
        { action: 'ouvrir', label: 'Ouvrir', icon: 'pi pi-play', severity: 'success' },
        { action: 'annuler', label: 'Annuler', icon: 'pi pi-times', severity: 'danger' }
    ],
    OUVERT: [
        { action: 'fermer', label: 'Fermer', icon: 'pi pi-lock' },
        { action: 'suspendre', label: 'Suspendre', icon: 'pi pi-pause', severity: 'warning' },
        { action: 'demarrer', label: 'Démarrer', icon: 'pi pi-forward', severity: 'success' },
        { action: 'annuler', label: 'Annuler', icon: 'pi pi-times', severity: 'danger' }
    ],
    FERME: [
        { action: 'ouvrir', label: 'Rouvrir', icon: 'pi pi-play', severity: 'success' },
        { action: 'cloturer', label: 'Clôturer', icon: 'pi pi-flag' },
        { action: 'annuler', label: 'Annuler', icon: 'pi pi-times', severity: 'danger' }
    ],
    CLOTURE: [
        { action: 'demarrer', label: 'Démarrer', icon: 'pi pi-forward', severity: 'success' },
        { action: 'annuler', label: 'Annuler', icon: 'pi pi-times', severity: 'danger' }
    ],
    EN_COURS: [{ action: 'terminer', label: 'Terminer', icon: 'pi pi-check', severity: 'success' }],
    SUSPENDU: [
        { action: 'reprendre', label: 'Reprendre', icon: 'pi pi-play', severity: 'success' },
        { action: 'annuler', label: 'Annuler', icon: 'pi pi-times', severity: 'danger' }
    ]
};

type TransitionAction = 'ouvrir' | 'fermer' | 'cloturer' | 'annuler' | 'demarrer' | 'terminer' | 'suspendre' | 'reprendre';

const FORM_VIDE: OffreForm = {
    trajetUuid: '',
    vehiculeUuid: '',
    dateDepart: '',
    heureDepart: '',
    heureArriveeEstimee: '',
    nombrePlacesTotal: '',
    montant: '',
    devise: 'GNF',
    pointRendezvous: '',
    conditions: '',
    annulationAutorisee: true,
    delaiAnnulationHeures: '24'
};

interface OffreForm {
    trajetUuid: string;
    vehiculeUuid: string;
    dateDepart: string;
    heureDepart: string;
    heureArriveeEstimee: string;
    nombrePlacesTotal: string;
    montant: string;
    devise: string;
    pointRendezvous: string;
    conditions: string;
    annulationAutorisee: boolean;
    delaiAnnulationHeures: string;
}

export function OffresAdminPage() {
    const { user } = useAuth();
    const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();

    // Un MANAGER (transporteur) ne voit que ses offres ; les admins voient tout.
    const estAdmin = hasRole(user, 'SUPER_ADMIN') || hasRole(user, 'ADMIN') || hasRole(user, 'ADMIN_BACKOFFICE');

    const offresQuery = useQuery({
        queryKey: ['admin-offres', estAdmin],
        queryFn: async () => (estAdmin ? (await api.offres.list()).data.offres : (await api.offres.mesOffres()).data.offres)
    });

    const trajetsQuery = useQuery({
        queryKey: ['admin-trajets'],
        queryFn: async () => (await api.transport.trajets()).data.trajets
    });

    const vehiculesQuery = useQuery({
        queryKey: ['admin-vehicules'],
        queryFn: async () => (await api.vehicules.vehicules()).data.vehicules
    });

    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Offre | null>(null);
    const [form, setForm] = useState<OffreForm>(FORM_VIDE);
    const [promoOffre, setPromoOffre] = useState<Offre | null>(null);
    const [promoMontant, setPromoMontant] = useState('');

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['admin-offres'] });

    const notifErreur = (err: unknown, fallback: string) => {
        const message = err instanceof ApiError ? err.message : fallback;
        toast.current?.show({ severity: 'error', summary: 'Échec', detail: message, life: 6000 });
    };

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: OffreRequest = {
                trajetUuid: form.trajetUuid,
                vehiculeUuid: form.vehiculeUuid,
                dateDepart: form.dateDepart,
                heureDepart: form.heureDepart,
                heureArriveeEstimee: form.heureArriveeEstimee || undefined,
                nombrePlacesTotal: Number(form.nombrePlacesTotal),
                montant: Number(form.montant),
                devise: form.devise,
                pointRendezvous: form.pointRendezvous || undefined,
                conditions: form.conditions || undefined,
                annulationAutorisee: form.annulationAutorisee,
                delaiAnnulationHeures: form.delaiAnnulationHeures ? Number(form.delaiAnnulationHeures) : undefined
            };
            return enEdition ? api.offres.update(enEdition.offreUuid!, body) : api.offres.create(body);
        },
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: enEdition ? 'Offre modifiée' : 'Offre créée' });
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => notifErreur(err, "L'enregistrement a échoué. Vérifiez les champs.")
    });

    const transition = useMutation({
        mutationFn: async ({ offre, action }: { offre: Offre; action: TransitionAction }) => api.offres[action](offre.offreUuid!),
        onSuccess: (_res, { action }) => {
            toast.current?.show({ severity: 'success', summary: `Action « ${action} » effectuée` });
            rafraichir();
        },
        onError: (err) => notifErreur(err, 'Transition refusée par le serveur.')
    });

    const appliquerPromo = useMutation({
        mutationFn: async () => api.offres.setPromotion(promoOffre!.offreUuid!, Number(promoMontant)),
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: 'Promotion appliquée' });
            setPromoOffre(null);
            rafraichir();
        },
        onError: (err) => notifErreur(err, "La promotion n'a pas pu être appliquée.")
    });

    const retirerPromo = useMutation({
        mutationFn: async (offre: Offre) => api.offres.removePromotion(offre.offreUuid!),
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: 'Promotion retirée' });
            rafraichir();
        },
        onError: (err) => notifErreur(err, "La promotion n'a pas pu être retirée.")
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(offre: Offre) {
        setEnEdition(offre);
        setForm({
            trajetUuid: offre.trajetUuid ?? '',
            vehiculeUuid: offre.vehiculeUuid ?? '',
            dateDepart: offre.dateDepart ?? '',
            heureDepart: formatHeure(offre.heureDepart) === '-' ? '' : formatHeure(offre.heureDepart),
            heureArriveeEstimee: formatHeure(offre.heureArriveeEstimee) === '-' ? '' : formatHeure(offre.heureArriveeEstimee),
            nombrePlacesTotal: String(offre.nombrePlacesTotal ?? ''),
            montant: String(offre.montant ?? ''),
            devise: offre.devise ?? 'GNF',
            pointRendezvous: offre.pointRendezvous ?? '',
            conditions: offre.conditions ?? '',
            annulationAutorisee: offre.annulationAutorisee ?? true,
            delaiAnnulationHeures: String(offre.delaiAnnulationHeures ?? '24')
        });
        setDialogOuvert(true);
    }

    const trajetsOptions = useMemo(
        () =>
            (trajetsQuery.data ?? []).map((t) => ({
                label: t.libelleTrajet || `${t.departVilleLibelle ?? t.departLibelle} → ${t.arriveeVilleLibelle ?? t.arriveeLibelle}`,
                value: t.trajetUuid
            })),
        [trajetsQuery.data]
    );

    const vehiculesOptions = useMemo(
        () =>
            (vehiculesQuery.data ?? []).map((v) => ({
                label: `${v.immatriculation} — ${v.marque ?? ''} ${v.modele ?? ''} (${v.nombrePlaces} pl.)`,
                value: v.vehiculeUuid
            })),
        [vehiculesQuery.data]
    );

    const formValide = form.trajetUuid && form.vehiculeUuid && form.dateDepart && form.heureDepart && form.nombrePlacesTotal && form.montant;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Offres de transport</h1>
                <Button label="Nouvelle offre" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            {offresQuery.isError && <p className="error">Impossible de charger les offres.</p>}

            <DataTable
                value={offresQuery.data ?? []}
                loading={offresQuery.isLoading}
                paginator
                rows={10}
                sortField="dateDepart"
                sortOrder={-1}
                emptyMessage="Aucune offre pour le moment."
                size="small"
                stripedRows
            >
                <Column
                    header="Trajet"
                    body={(o: Offre) => (
                        <div className="cellule-trajet">
                            <strong>
                                {o.villeDepartLibelle} → {o.villeArriveeLibelle}
                            </strong>
                            <span className="muted">{o.vehiculeImmatriculation}</span>
                        </div>
                    )}
                />
                <Column header="Départ" sortable field="dateDepart" body={(o: Offre) => `${formatDateFr(o.dateDepart)} ${formatHeure(o.heureDepart)}`} />
                <Column
                    header="Places"
                    body={(o: Offre) => `${o.nombrePlacesReservees ?? 0}/${o.nombrePlacesTotal ?? 0} (${getTauxRemplissage(o)}%)`}
                />
                <Column
                    header="Montant"
                    body={(o: Offre) =>
                        hasPromotion(o) ? (
                            <span>
                                <s className="muted">{formatMontant(o.montant, o.devise)}</s> <strong>{formatMontant(o.montantPromotion, o.devise)}</strong>
                            </span>
                        ) : (
                            formatMontant(o.montant, o.devise)
                        )
                    }
                />
                <Column
                    header="Statut"
                    body={(o: Offre) => {
                        const sev = getStatutOffreSeverity(o.statut);
                        return <Tag value={getStatutOffreLabel(o.statut)} severity={sev === 'warn' ? 'warning' : sev === 'contrast' ? undefined : sev} />;
                    }}
                />
                <Column
                    header="Actions"
                    body={(o: Offre) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(o)} />
                            {(TRANSITIONS[o.statut ?? ''] ?? []).map((t) => (
                                <Button
                                    key={t.action}
                                    icon={t.icon}
                                    rounded
                                    text
                                    severity={t.severity}
                                    tooltip={t.label}
                                    disabled={transition.isPending}
                                    onClick={() => transition.mutate({ offre: o, action: t.action })}
                                />
                            ))}
                            {hasPromotion(o) ? (
                                <Button
                                    icon="pi pi-percentage"
                                    rounded
                                    text
                                    severity="warning"
                                    tooltip="Retirer la promotion"
                                    onClick={() => retirerPromo.mutate(o)}
                                />
                            ) : (
                                (o.statut === 'OUVERT' || o.statut === 'EN_ATTENTE') && (
                                    <Button
                                        icon="pi pi-tag"
                                        rounded
                                        text
                                        tooltip="Appliquer une promotion"
                                        onClick={() => {
                                            setPromoOffre(o);
                                            setPromoMontant('');
                                        }}
                                    />
                                )
                            )}
                        </div>
                    )}
                />
            </DataTable>

            {/* --- Dialog création / édition --- */}
            <Dialog
                header={enEdition ? "Modifier l'offre" : 'Nouvelle offre'}
                visible={dialogOuvert}
                style={{ width: 'min(640px, 95vw)' }}
                onHide={() => setDialogOuvert(false)}
                modal
            >
                <div className="form-grid">
                    <label className="span-2">
                        Trajet *
                        <Dropdown
                            value={form.trajetUuid}
                            options={trajetsOptions}
                            onChange={(e) => setForm({ ...form, trajetUuid: e.value })}
                            placeholder="Choisir un trajet"
                            filter
                            loading={trajetsQuery.isLoading}
                        />
                    </label>
                    <label className="span-2">
                        Véhicule *
                        <Dropdown
                            value={form.vehiculeUuid}
                            options={vehiculesOptions}
                            onChange={(e) => setForm({ ...form, vehiculeUuid: e.value })}
                            placeholder="Choisir un véhicule"
                            filter
                            loading={vehiculesQuery.isLoading}
                        />
                    </label>
                    <label>
                        Date de départ *
                        <input type="date" value={form.dateDepart} onChange={(e) => setForm({ ...form, dateDepart: e.target.value })} />
                    </label>
                    <label>
                        Heure de départ *
                        <input type="time" value={form.heureDepart} onChange={(e) => setForm({ ...form, heureDepart: e.target.value })} />
                    </label>
                    <label>
                        Heure d'arrivée estimée
                        <input type="time" value={form.heureArriveeEstimee} onChange={(e) => setForm({ ...form, heureArriveeEstimee: e.target.value })} />
                    </label>
                    <label>
                        Nombre de places *
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={form.nombrePlacesTotal}
                            onChange={(e) => setForm({ ...form, nombrePlacesTotal: e.target.value })}
                        />
                    </label>
                    <label>
                        Montant *
                        <input type="number" min={0} step={1000} value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
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
                        Point de rendez-vous
                        <input value={form.pointRendezvous} onChange={(e) => setForm({ ...form, pointRendezvous: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Conditions
                        <textarea rows={2} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
                    </label>
                    <label className="ligne">
                        <input
                            type="checkbox"
                            checked={form.annulationAutorisee}
                            onChange={(e) => setForm({ ...form, annulationAutorisee: e.target.checked })}
                        />
                        Annulation autorisée
                    </label>
                    {form.annulationAutorisee && (
                        <label>
                            Délai d'annulation (heures)
                            <input
                                type="number"
                                min={0}
                                value={form.delaiAnnulationHeures}
                                onChange={(e) => setForm({ ...form, delaiAnnulationHeures: e.target.value })}
                            />
                        </label>
                    )}
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

            {/* --- Dialog promotion --- */}
            <Dialog
                header={`Promotion — ${promoOffre?.villeDepartLibelle} → ${promoOffre?.villeArriveeLibelle}`}
                visible={promoOffre !== null}
                style={{ width: 'min(420px, 95vw)' }}
                onHide={() => setPromoOffre(null)}
                modal
            >
                <p className="muted">
                    Prix actuel : <strong>{formatMontant(promoOffre?.montant, promoOffre?.devise)}</strong>
                </p>
                <label>
                    Montant promotionnel *
                    <input type="number" min={0} step={1000} value={promoMontant} onChange={(e) => setPromoMontant(e.target.value)} autoFocus />
                </label>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setPromoOffre(null)} />
                    <Button
                        label="Appliquer"
                        icon="pi pi-tag"
                        disabled={!promoMontant || Number(promoMontant) <= 0 || Number(promoMontant) >= (promoOffre?.montant ?? 0) || appliquerPromo.isPending}
                        onClick={() => appliquerPromo.mutate()}
                    />
                </div>
            </Dialog>
        </section>
    );
}
