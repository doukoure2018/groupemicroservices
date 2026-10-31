import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    COULEURS_VEHICULE,
    getStatutVehiculeLabel,
    getStatutVehiculeSeverity,
    hasRole,
    type Vehicule,
    type VehiculeRequest
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
import { confirmerSuppression } from './shared';
import { useAuth } from '../../auth-context';

type StatutAction = 'activer' | 'desactiver' | 'maintenance' | 'suspendre';

/** Actions de statut proposées selon l'état courant. */
const ACTIONS_STATUT: Record<string, { action: StatutAction; label: string; icon: string; severity?: 'danger' | 'warning' | 'success' }[]> = {
    ACTIF: [
        { action: 'desactiver', label: 'Désactiver', icon: 'pi pi-power-off' },
        { action: 'maintenance', label: 'Mettre en maintenance', icon: 'pi pi-wrench', severity: 'warning' },
        { action: 'suspendre', label: 'Suspendre', icon: 'pi pi-ban', severity: 'danger' }
    ],
    INACTIF: [{ action: 'activer', label: 'Activer', icon: 'pi pi-power-off', severity: 'success' }],
    EN_MAINTENANCE: [{ action: 'activer', label: 'Remettre en service', icon: 'pi pi-check', severity: 'success' }],
    SUSPENDU: [{ action: 'activer', label: 'Réactiver', icon: 'pi pi-check', severity: 'success' }]
};

interface VehiculeForm {
    typeVehiculeUuid: string;
    immatriculation: string;
    marque: string;
    modele: string;
    anneeFabrication: string;
    nombrePlaces: string;
    nomChauffeur: string;
    contactChauffeur: string;
    contactProprietaire: string;
    couleur: string;
    climatise: boolean;
    dateExpirationAssurance: string;
    dateExpirationVisite: string;
    description: string;
}

const FORM_VIDE: VehiculeForm = {
    typeVehiculeUuid: '',
    immatriculation: '',
    marque: '',
    modele: '',
    anneeFabrication: '',
    nombrePlaces: '',
    nomChauffeur: '',
    contactChauffeur: '',
    contactProprietaire: '',
    couleur: '',
    climatise: false,
    dateExpirationAssurance: '',
    dateExpirationVisite: '',
    description: ''
};

function estExpiree(date: string | undefined): boolean {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
}

export function VehiculesAdminPage() {
    const { user } = useAuth();
    const toast = useRef<Toast>(null);
    const queryClient = useQueryClient();

    const estAdmin = hasRole(user, 'SUPER_ADMIN') || hasRole(user, 'ADMIN') || hasRole(user, 'ADMIN_BACKOFFICE');

    const vehiculesQuery = useQuery({
        queryKey: ['admin-vehicules-liste', estAdmin],
        queryFn: async () => (estAdmin ? (await api.vehicules.vehicules()).data.vehicules : (await api.vehicules.mesVehicules()).data.vehicules)
    });

    const typesQuery = useQuery({
        queryKey: ['types-vehicules'],
        queryFn: async () => (await api.vehicules.typesVehicules()).data.typesVehicules
    });

    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Vehicule | null>(null);
    const [form, setForm] = useState<VehiculeForm>(FORM_VIDE);

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['admin-vehicules-liste'] });
    const notifErreur = (err: unknown, fallback: string) =>
        toast.current?.show({ severity: 'error', summary: 'Échec', detail: err instanceof ApiError ? err.message : fallback, life: 6000 });

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: VehiculeRequest = {
                typeVehiculeUuid: form.typeVehiculeUuid || undefined,
                immatriculation: form.immatriculation.trim(),
                marque: form.marque || undefined,
                modele: form.modele || undefined,
                anneeFabrication: form.anneeFabrication ? Number(form.anneeFabrication) : undefined,
                nombrePlaces: Number(form.nombrePlaces),
                nomChauffeur: form.nomChauffeur.trim(),
                contactChauffeur: form.contactChauffeur.trim(),
                contactProprietaire: form.contactProprietaire || undefined,
                couleur: form.couleur || undefined,
                climatise: form.climatise,
                dateExpirationAssurance: form.dateExpirationAssurance || undefined,
                dateExpirationVisite: form.dateExpirationVisite || undefined,
                description: form.description || undefined
            };
            return enEdition ? api.vehicules.update(enEdition.vehiculeUuid!, body) : api.vehicules.create(body);
        },
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: enEdition ? 'Véhicule modifié' : 'Véhicule créé' });
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => notifErreur(err, "L'enregistrement a échoué. Vérifiez les champs (immatriculation unique).")
    });

    const changerStatut = useMutation({
        mutationFn: async ({ vehicule, action }: { vehicule: Vehicule; action: StatutAction }) => api.vehicules[action](vehicule.vehiculeUuid!),
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: 'Statut mis à jour' });
            rafraichir();
        },
        onError: (err) => notifErreur(err, 'Changement de statut refusé.')
    });

    // Un véhicule affecté à des offres sera refusé par le serveur, qui garde
    // le dernier mot : le message d'erreur remonte tel quel.
    const supprimer = useMutation({
        mutationFn: async (vehicule: Vehicule) => api.vehicules.delete(vehicule.vehiculeUuid!),
        onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: 'Véhicule supprimé' });
            rafraichir();
        },
        onError: (err) => notifErreur(err, 'Impossible de supprimer ce véhicule. Vérifiez qu\'aucune offre ne l\'utilise.')
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(v: Vehicule) {
        setEnEdition(v);
        setForm({
            typeVehiculeUuid: v.typeVehiculeUuid ?? '',
            immatriculation: v.immatriculation ?? '',
            marque: v.marque ?? '',
            modele: v.modele ?? '',
            anneeFabrication: String(v.anneeFabrication ?? ''),
            nombrePlaces: String(v.nombrePlaces ?? ''),
            nomChauffeur: v.nomChauffeur ?? '',
            contactChauffeur: v.contactChauffeur ?? '',
            contactProprietaire: v.contactProprietaire ?? '',
            couleur: v.couleur ?? '',
            climatise: v.climatise ?? false,
            dateExpirationAssurance: v.dateExpirationAssurance?.slice(0, 10) ?? '',
            dateExpirationVisite: v.dateExpirationVisite?.slice(0, 10) ?? '',
            description: v.description ?? ''
        });
        setDialogOuvert(true);
    }

    const typesOptions = useMemo(
        () => (typesQuery.data ?? []).map((t) => ({ label: t.libelle ?? '?', value: t.typeVehiculeUuid })),
        [typesQuery.data]
    );

    const vehicules = vehiculesQuery.data ?? [];
    const nbAssurancesExpirees = vehicules.filter((v) => estExpiree(v.dateExpirationAssurance)).length;
    const nbVisitesExpirees = vehicules.filter((v) => estExpiree(v.dateExpirationVisite)).length;

    const formValide = form.immatriculation.trim() && form.nombrePlaces && form.nomChauffeur.trim() && form.contactChauffeur.trim();

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Véhicules</h1>
                <Button label="Nouveau véhicule" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            {(nbAssurancesExpirees > 0 || nbVisitesExpirees > 0) && (
                <p className="error">
                    ⚠️ {nbAssurancesExpirees > 0 && `${nbAssurancesExpirees} assurance(s) expirée(s)`}
                    {nbAssurancesExpirees > 0 && nbVisitesExpirees > 0 && ' — '}
                    {nbVisitesExpirees > 0 && `${nbVisitesExpirees} visite(s) technique(s) expirée(s)`}
                </p>
            )}

            {vehiculesQuery.isError && <p className="error">Impossible de charger les véhicules.</p>}

            <DataTable value={vehicules} loading={vehiculesQuery.isLoading} paginator rows={10} emptyMessage="Aucun véhicule." size="small" stripedRows>
                <Column
                    header="Véhicule"
                    body={(v: Vehicule) => (
                        <div className="cellule-trajet">
                            <strong>{v.immatriculation}</strong>
                            <span className="muted">
                                {v.marque} {v.modele} {v.couleur ? `· ${v.couleur}` : ''} {v.climatise ? '· Climatisé' : ''}
                            </span>
                        </div>
                    )}
                />
                <Column header="Type" body={(v: Vehicule) => v.typeVehiculeLibelle ?? '-'} />
                <Column header="Places" field="nombrePlaces" sortable />
                <Column
                    header="Chauffeur"
                    body={(v: Vehicule) => (
                        <div className="cellule-trajet">
                            <span>{v.nomChauffeur ?? '-'}</span>
                            <span className="muted">{v.contactChauffeur}</span>
                        </div>
                    )}
                />
                <Column
                    header="Documents"
                    body={(v: Vehicule) => (
                        <div className="cellule-trajet">
                            <span className={estExpiree(v.dateExpirationAssurance) ? 'texte-danger' : 'muted'}>
                                Assurance : {v.dateExpirationAssurance?.slice(0, 10) ?? '—'}
                            </span>
                            <span className={estExpiree(v.dateExpirationVisite) ? 'texte-danger' : 'muted'}>
                                Visite : {v.dateExpirationVisite?.slice(0, 10) ?? '—'}
                            </span>
                        </div>
                    )}
                />
                <Column
                    header="Statut"
                    body={(v: Vehicule) => {
                        const sev = getStatutVehiculeSeverity(v.statut);
                        return <Tag value={getStatutVehiculeLabel(v.statut)} severity={sev === 'warn' ? 'warning' : sev} />;
                    }}
                />
                <Column
                    header="Actions"
                    body={(v: Vehicule) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(v)} />
                            {(ACTIONS_STATUT[v.statut ?? ''] ?? []).map((a) => (
                                <Button
                                    key={a.action}
                                    icon={a.icon}
                                    rounded
                                    text
                                    severity={a.severity}
                                    tooltip={a.label}
                                    disabled={changerStatut.isPending}
                                    onClick={() => changerStatut.mutate({ vehicule: v, action: a.action })}
                                />
                            ))}
                            <Button
                                icon="pi pi-trash"
                                rounded
                                text
                                severity="danger"
                                tooltip="Supprimer"
                                disabled={supprimer.isPending}
                                onClick={() => confirmerSuppression(v.immatriculation ?? 'ce véhicule', () => supprimer.mutate(v))}
                            />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog
                header={enEdition ? 'Modifier le véhicule' : 'Nouveau véhicule'}
                visible={dialogOuvert}
                style={{ width: 'min(640px, 95vw)' }}
                onHide={() => setDialogOuvert(false)}
                modal
            >
                <div className="form-grid">
                    <label>
                        Immatriculation *
                        <input value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} />
                    </label>
                    <label>
                        Type de véhicule
                        <Dropdown
                            value={form.typeVehiculeUuid}
                            options={typesOptions}
                            onChange={(e) => setForm({ ...form, typeVehiculeUuid: e.value })}
                            placeholder="Choisir un type"
                            loading={typesQuery.isLoading}
                            showClear
                        />
                    </label>
                    <label>
                        Marque
                        <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} />
                    </label>
                    <label>
                        Modèle
                        <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} />
                    </label>
                    <label>
                        Année de fabrication
                        <input
                            type="number"
                            min={1980}
                            max={2030}
                            value={form.anneeFabrication}
                            onChange={(e) => setForm({ ...form, anneeFabrication: e.target.value })}
                        />
                    </label>
                    <label>
                        Nombre de places *
                        <input type="number" min={1} max={100} value={form.nombrePlaces} onChange={(e) => setForm({ ...form, nombrePlaces: e.target.value })} />
                    </label>
                    <label>
                        Nom du chauffeur *
                        <input value={form.nomChauffeur} onChange={(e) => setForm({ ...form, nomChauffeur: e.target.value })} />
                    </label>
                    <label>
                        Contact du chauffeur *
                        <input type="tel" value={form.contactChauffeur} onChange={(e) => setForm({ ...form, contactChauffeur: e.target.value })} />
                    </label>
                    <label>
                        Contact du propriétaire
                        <input type="tel" value={form.contactProprietaire} onChange={(e) => setForm({ ...form, contactProprietaire: e.target.value })} />
                    </label>
                    <label>
                        Couleur
                        <Dropdown
                            value={form.couleur}
                            options={COULEURS_VEHICULE.map((c) => ({ label: c, value: c }))}
                            onChange={(e) => setForm({ ...form, couleur: e.value })}
                            placeholder="Choisir"
                            showClear
                        />
                    </label>
                    <label>
                        Expiration assurance
                        <input
                            type="date"
                            value={form.dateExpirationAssurance}
                            onChange={(e) => setForm({ ...form, dateExpirationAssurance: e.target.value })}
                        />
                    </label>
                    <label>
                        Expiration visite technique
                        <input type="date" value={form.dateExpirationVisite} onChange={(e) => setForm({ ...form, dateExpirationVisite: e.target.value })} />
                    </label>
                    <label className="ligne">
                        <input type="checkbox" checked={form.climatise} onChange={(e) => setForm({ ...form, climatise: e.target.checked })} />
                        Climatisé
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
