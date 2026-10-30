import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TypeVehicule, TypeVehiculeRequest } from '@sira/core';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../../api';
import { confirmerSuppression, num, str, useNotif } from './shared';

interface TypeForm {
    libelle: string;
    description: string;
    capaciteMin: string;
    capaciteMax: string;
    actif: boolean;
}

const FORM_VIDE: TypeForm = { libelle: '', description: '', capaciteMin: '', capaciteMax: '', actif: true };

export function TypesVehiculesAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-types-vehicules'];

    const typesQuery = useQuery({
        queryKey: CLE,
        queryFn: async () => (await api.vehicules.typesVehicules()).data.typesVehicules
    });

    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<TypeVehicule | null>(null);
    const [form, setForm] = useState<TypeForm>(FORM_VIDE);

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: CLE });
        void queryClient.invalidateQueries({ queryKey: ['types-vehicules'] }); // dropdown de l'écran Véhicules
    };

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: TypeVehiculeRequest = {
                libelle: form.libelle.trim(),
                description: form.description || undefined,
                capaciteMin: num(form.capaciteMin),
                capaciteMax: num(form.capaciteMax),
                actif: form.actif
            };
            return enEdition ? api.vehicules.updateType(enEdition.typeVehiculeUuid!, body) : api.vehicules.createType(body);
        },
        onSuccess: () => {
            succes(enEdition ? 'Type de véhicule modifié' : 'Type de véhicule créé');
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'enregistrement du type de véhicule a échoué.")
    });

    const supprimer = useMutation({
        mutationFn: async (t: TypeVehicule) => api.vehicules.deleteType(t.typeVehiculeUuid!),
        onSuccess: () => {
            succes('Type de véhicule supprimé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'La suppression a échoué (des véhicules utilisent ce type ?).')
    });

    const basculerActif = useMutation({
        mutationFn: async (t: TypeVehicule) => api.vehicules.toggleTypeActif(t.typeVehiculeUuid!),
        onSuccess: (res) => {
            succes(res.data.typeVehicule?.actif ? 'Type activé' : 'Type désactivé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de changer le statut.')
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(t: TypeVehicule) {
        setEnEdition(t);
        setForm({
            libelle: t.libelle ?? '',
            description: t.description ?? '',
            capaciteMin: str(t.capaciteMin),
            capaciteMax: str(t.capaciteMax),
            actif: t.actif ?? true
        });
        setDialogOuvert(true);
    }

    const capMin = num(form.capaciteMin);
    const capMax = num(form.capaciteMax);
    const capaciteCoherente = capMin === undefined || capMax === undefined || capMin <= capMax;
    const formValide = form.libelle.trim().length >= 2 && capaciteCoherente;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Types de véhicules</h1>
                <Button label="Nouveau type" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            {typesQuery.isError && <p className="error">Impossible de charger les types de véhicules.</p>}

            <DataTable value={typesQuery.data ?? []} loading={typesQuery.isLoading} paginator rows={10} size="small" stripedRows emptyMessage="Aucun type de véhicule.">
                <Column
                    header="Type"
                    body={(t: TypeVehicule) => (
                        <div className="cellule-trajet">
                            <strong>{t.libelle}</strong>
                            {t.description && <span className="muted">{t.description}</span>}
                        </div>
                    )}
                />
                <Column
                    header="Capacité"
                    body={(t: TypeVehicule) =>
                        t.capaciteMin || t.capaciteMax ? `${t.capaciteMin ?? '?'} à ${t.capaciteMax ?? '?'} places` : <span className="muted">Non précisée</span>
                    }
                />
                <Column header="Statut" body={(t: TypeVehicule) => <Tag value={t.actif ? 'Actif' : 'Inactif'} severity={t.actif ? 'success' : 'secondary'} />} />
                <Column
                    header="Actions"
                    body={(t: TypeVehicule) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(t)} />
                            <Button
                                icon="pi pi-power-off"
                                rounded
                                text
                                severity={t.actif ? 'danger' : 'success'}
                                tooltip={t.actif ? 'Désactiver' : 'Activer'}
                                disabled={basculerActif.isPending}
                                onClick={() => basculerActif.mutate(t)}
                            />
                            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Supprimer" onClick={() => confirmerSuppression(t.libelle ?? 'ce type', () => supprimer.mutate(t))} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? 'Modifier le type de véhicule' : 'Nouveau type de véhicule'} visible={dialogOuvert} style={{ width: 'min(520px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <div className="form-grid">
                    <label className="span-2">
                        Libellé *
                        <input value={form.libelle} placeholder="ex. Minibus 18 places" onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
                    </label>
                    <label>
                        Capacité minimale
                        <input type="number" min={1} value={form.capaciteMin} onChange={(e) => setForm({ ...form, capaciteMin: e.target.value })} />
                    </label>
                    <label>
                        Capacité maximale
                        <input type="number" min={1} value={form.capaciteMax} onChange={(e) => setForm({ ...form, capaciteMax: e.target.value })} />
                    </label>
                    {!capaciteCoherente && <p className="error span-2">La capacité minimale doit être inférieure ou égale à la capacité maximale.</p>}
                    <label className="span-2">
                        Description
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                    <label className="ligne span-2">
                        <Checkbox checked={form.actif} onChange={(e) => setForm({ ...form, actif: !!e.checked })} />
                        Type actif
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button label={sauvegarder.isPending ? 'Enregistrement…' : 'Enregistrer'} icon="pi pi-check" disabled={!formValide || sauvegarder.isPending} onClick={() => sauvegarder.mutate()} />
                </div>
            </Dialog>
        </section>
    );
}
