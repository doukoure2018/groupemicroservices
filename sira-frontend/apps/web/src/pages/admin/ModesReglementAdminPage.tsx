import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CODES_MODE_REGLEMENT, formatFrais, type ModeReglement, type ModeReglementRequest } from '@sira/core';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../../api';
import { confirmerSuppression, num, str, useNotif } from './shared';

interface ModeForm {
    libelle: string;
    code: string;
    description: string;
    fraisPourcentage: string;
    fraisFixe: string;
    actif: boolean;
}

const FORM_VIDE: ModeForm = { libelle: '', code: '', description: '', fraisPourcentage: '', fraisFixe: '', actif: true };

export function ModesReglementAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-modes-reglement'];

    const modesQuery = useQuery({
        queryKey: CLE,
        queryFn: async () => (await api.commercial.modesReglement()).data.modesReglement
    });

    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<ModeReglement | null>(null);
    const [form, setForm] = useState<ModeForm>(FORM_VIDE);

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: ModeReglementRequest = {
                libelle: form.libelle.trim(),
                code: form.code,
                description: form.description || undefined,
                fraisPourcentage: num(form.fraisPourcentage),
                fraisFixe: num(form.fraisFixe),
                actif: form.actif
            };
            return enEdition ? api.commercial.updateModeReglement(enEdition.modeReglementUuid!, body) : api.commercial.createModeReglement(body);
        },
        onSuccess: () => {
            succes(enEdition ? 'Mode de règlement modifié' : 'Mode de règlement créé');
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'enregistrement du mode de règlement a échoué.")
    });

    const supprimer = useMutation({
        mutationFn: async (m: ModeReglement) => api.commercial.deleteModeReglement(m.modeReglementUuid!),
        onSuccess: () => {
            succes('Mode de règlement supprimé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'La suppression a échoué (mode utilisé par des commandes ?).')
    });

    const basculerActif = useMutation({
        mutationFn: async (m: ModeReglement) => api.commercial.toggleModeReglementActif(m.modeReglementUuid!),
        onSuccess: (res) => {
            succes(res.data.modeReglement?.actif ? 'Mode activé' : 'Mode désactivé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de changer le statut.')
    });

    // Dialog dédié « Modifier les frais » (PATCH /frais, valeurs en query params comme dans l'Angular).
    const [fraisDe, setFraisDe] = useState<ModeReglement | null>(null);
    const [frais, setFrais] = useState({ pourcentage: '', fixe: '' });
    const sauverFrais = useMutation({
        mutationFn: async () => api.commercial.setFraisModeReglement(fraisDe!.modeReglementUuid!, num(frais.pourcentage) ?? 0, num(frais.fixe) ?? 0),
        onSuccess: () => {
            succes('Frais mis à jour');
            setFraisDe(null);
            rafraichir();
        },
        onError: (err) => erreur(err, 'La mise à jour des frais a échoué.')
    });
    function ouvrirFrais(m: ModeReglement) {
        setFraisDe(m);
        setFrais({ pourcentage: str(m.fraisPourcentage), fixe: str(m.fraisFixe) });
    }

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(m: ModeReglement) {
        setEnEdition(m);
        setForm({
            libelle: m.libelle ?? '',
            code: m.code ?? '',
            description: m.description ?? '',
            fraisPourcentage: str(m.fraisPourcentage),
            fraisFixe: str(m.fraisFixe),
            actif: m.actif ?? true
        });
        setDialogOuvert(true);
    }

    const formValide = form.libelle.trim().length >= 2 && !!form.code;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Modes de règlement</h1>
                <Button label="Nouveau mode" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            {modesQuery.isError && <p className="error">Impossible de charger les modes de règlement.</p>}

            <DataTable value={modesQuery.data ?? []} loading={modesQuery.isLoading} paginator rows={10} size="small" stripedRows emptyMessage="Aucun mode de règlement.">
                <Column
                    header="Mode"
                    body={(m: ModeReglement) => (
                        <div className="cellule-trajet">
                            <strong>{m.libelle}</strong>
                            {m.description && <span className="muted">{m.description}</span>}
                        </div>
                    )}
                />
                <Column header="Code" body={(m: ModeReglement) => <code>{m.code}</code>} />
                <Column header="Frais" body={(m: ModeReglement) => formatFrais(m.fraisPourcentage, m.fraisFixe)} />
                <Column header="Statut" body={(m: ModeReglement) => <Tag value={m.actif ? 'Actif' : 'Inactif'} severity={m.actif ? 'success' : 'secondary'} />} />
                <Column
                    header="Actions"
                    body={(m: ModeReglement) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(m)} />
                            <Button icon="pi pi-percentage" rounded text severity="info" tooltip="Modifier les frais" onClick={() => ouvrirFrais(m)} />
                            <Button
                                icon="pi pi-power-off"
                                rounded
                                text
                                severity={m.actif ? 'danger' : 'success'}
                                tooltip={m.actif ? 'Désactiver' : 'Activer'}
                                disabled={basculerActif.isPending}
                                onClick={() => basculerActif.mutate(m)}
                            />
                            <Button
                                icon="pi pi-trash"
                                rounded
                                text
                                severity="danger"
                                tooltip="Supprimer"
                                onClick={() => confirmerSuppression(m.libelle ?? m.code ?? 'ce mode', () => supprimer.mutate(m))}
                            />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? 'Modifier le mode de règlement' : 'Nouveau mode de règlement'} visible={dialogOuvert} style={{ width: 'min(560px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <div className="form-grid">
                    <label className="span-2">
                        Libellé *
                        <input value={form.libelle} placeholder="ex. Orange Money" onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Code *
                        <Dropdown
                            value={form.code}
                            options={CODES_MODE_REGLEMENT.map((c) => ({ label: `${c.label} (${c.value})`, value: c.value }))}
                            onChange={(e) => setForm({ ...form, code: e.value, libelle: form.libelle || CODES_MODE_REGLEMENT.find((c) => c.value === e.value)?.label || '' })}
                            placeholder="Choisir un code"
                            disabled={!!enEdition}
                        />
                    </label>
                    <label>
                        Frais (%)
                        <input type="number" min={0} max={100} step={0.1} value={form.fraisPourcentage} onChange={(e) => setForm({ ...form, fraisPourcentage: e.target.value })} />
                    </label>
                    <label>
                        Frais fixes (GNF)
                        <input type="number" min={0} step={500} value={form.fraisFixe} onChange={(e) => setForm({ ...form, fraisFixe: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Description
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                    <label className="ligne span-2">
                        <Checkbox checked={form.actif} onChange={(e) => setForm({ ...form, actif: !!e.checked })} />
                        Mode actif (proposé aux clients)
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button label={sauvegarder.isPending ? 'Enregistrement…' : 'Enregistrer'} icon="pi pi-check" disabled={!formValide || sauvegarder.isPending} onClick={() => sauvegarder.mutate()} />
                </div>
            </Dialog>

            <Dialog header="Modifier les frais" visible={!!fraisDe} style={{ width: 'min(420px, 95vw)' }} onHide={() => setFraisDe(null)} modal>
                <p>
                    <strong>{fraisDe?.libelle}</strong> <span className="muted">({fraisDe?.code})</span>
                </p>
                <div className="form-grid">
                    <label>
                        Frais (%)
                        <input type="number" min={0} max={100} step={0.1} value={frais.pourcentage} onChange={(e) => setFrais({ ...frais, pourcentage: e.target.value })} />
                    </label>
                    <label>
                        Frais fixes (GNF)
                        <input type="number" min={0} step={500} value={frais.fixe} onChange={(e) => setFrais({ ...frais, fixe: e.target.value })} />
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setFraisDe(null)} />
                    <Button label="Enregistrer" icon="pi pi-check" disabled={sauverFrais.isPending} onClick={() => sauverFrais.mutate()} />
                </div>
            </Dialog>
        </section>
    );
}
