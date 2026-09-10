import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Depart, DepartRequest } from '@sira/core';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useState } from 'react';
import { api } from '../../api';
import { getTypeSiteLabel } from './SitesAdminPage';
import { confirmerSuppression, num, StatCarte, str, tronquer, useNotif } from './shared';

interface DepartForm {
    siteUuid: string;
    libelle: string;
    description: string;
    ordreAffichage: string;
}

const FORM_VIDE: DepartForm = { siteUuid: '', libelle: '', description: '', ordreAffichage: '0' };

export function DepartsAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-departs'];

    const departsQuery = useQuery({ queryKey: CLE, queryFn: async () => (await api.transport.departs()).data.departs });
    const sitesQuery = useQuery({ queryKey: ['sites-actifs'], queryFn: async () => (await api.transport.sitesActifs()).data.sites });

    const [recherche, setRecherche] = useState('');
    const [filtreSite, setFiltreSite] = useState<string | null>(null);
    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Depart | null>(null);
    const [form, setForm] = useState<DepartForm>(FORM_VIDE);

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: CLE });
        void queryClient.invalidateQueries({ queryKey: ['admin-departs-actifs'] });
        void queryClient.invalidateQueries({ queryKey: ['admin-departs'] });
    };

    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        return (departsQuery.data ?? []).filter((d) => {
            if (filtreSite && d.siteUuid !== filtreSite) return false;
            if (!q) return true;
            return [d.libelle, d.siteNom, d.villeLibelle].some((v) => v?.toLowerCase().includes(q));
        });
    }, [departsQuery.data, recherche, filtreSite]);

    const stats = useMemo(() => {
        const tous = departsQuery.data ?? [];
        return { total: tous.length, actifs: tous.filter((d) => d.actif).length, sites: (sitesQuery.data ?? []).length };
    }, [departsQuery.data, sitesQuery.data]);

    const sitesOptions = useMemo(
        () => (sitesQuery.data ?? []).map((s) => ({ label: `${s.nom} — ${s.villeLibelle ?? '?'} · ${getTypeSiteLabel(s.typeSite)}`, value: s.siteUuid })),
        [sitesQuery.data]
    );

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: DepartRequest = {
                siteUuid: form.siteUuid,
                libelle: form.libelle.trim(),
                description: form.description || undefined,
                ordreAffichage: num(form.ordreAffichage) ?? 0,
                actif: enEdition?.actif ?? true
            };
            return enEdition ? api.transport.updateDepart(enEdition.departUuid!, body) : api.transport.createDepart(body);
        },
        onSuccess: () => {
            succes(enEdition ? 'Point de départ mis à jour avec succès' : 'Point de départ créé avec succès');
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, enEdition ? 'Impossible de mettre à jour le point de départ' : 'Impossible de créer le point de départ')
    });

    const basculerActif = useMutation({
        mutationFn: async (d: Depart) => api.transport.toggleDepartActif(d.departUuid!),
        onSuccess: (res) => {
            succes(res.data.depart?.actif ? 'Point de départ activé' : 'Point de départ désactivé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de modifier le statut')
    });

    const supprimer = useMutation({
        mutationFn: async (d: Depart) => api.transport.deleteDepart(d.departUuid!),
        onSuccess: () => {
            succes('Point de départ supprimé avec succès');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de supprimer le point de départ')
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(d: Depart) {
        setEnEdition(d);
        setForm({ siteUuid: d.siteUuid ?? '', libelle: d.libelle ?? '', description: d.description ?? '', ordreAffichage: str(d.ordreAffichage ?? 0) });
        setDialogOuvert(true);
    }

    const filtresActifs = !!recherche || !!filtreSite;
    const formValide = !!form.siteUuid && form.libelle.trim().length >= 2;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Points de départ</h1>
                    <p className="muted">Gestion des points de départ pour chaque site</p>
                </div>
                <Button label="Nouveau départ" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Total départs" valeur={stats.total} />
                <StatCarte libelle="Départs actifs" valeur={stats.actifs} ton="succes" />
                <StatCarte libelle="Sites disponibles" valeur={stats.sites} />
            </div>

            <div className="barre-filtres">
                <input placeholder="Rechercher par libellé, site, ville…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Dropdown value={filtreSite} options={sitesOptions} onChange={(e) => setFiltreSite(e.value ?? null)} placeholder="Filtrer par site" filter showClear className="filtre-dropdown" />
                {filtresActifs && (
                    <Button
                        label="Effacer filtres"
                        icon="pi pi-filter-slash"
                        text
                        onClick={() => {
                            setRecherche('');
                            setFiltreSite(null);
                        }}
                    />
                )}
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" onClick={rafraichir} />
            </div>

            {departsQuery.isError && <p className="error">Impossible de charger les points de départ</p>}

            <DataTable value={liste} loading={departsQuery.isLoading} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} size="small" stripedRows emptyMessage="Aucun point de départ trouvé" scrollable>
                <Column
                    header="Libellé"
                    field="libelle"
                    sortable
                    body={(d: Depart) => (
                        <div className="cellule-trajet">
                            <strong>{d.libelle}</strong>
                            {d.description && <span className="muted">{tronquer(d.description, 50)}</span>}
                        </div>
                    )}
                />
                <Column header="Site" field="siteNom" sortable />
                <Column
                    header="Ville"
                    field="villeLibelle"
                    sortable
                    body={(d: Depart) => (
                        <div className="cellule-trajet">
                            <span>{d.villeLibelle ?? '-'}</span>
                            {d.regionLibelle && <span className="muted">{d.regionLibelle}</span>}
                        </div>
                    )}
                />
                <Column header="Adresse" body={(d: Depart) => tronquer(d.adresseComplete, 35) || '-'} />
                <Column header="Ordre" field="ordreAffichage" sortable body={(d: Depart) => <Badge value={d.ordreAffichage ?? 0} severity="secondary" />} />
                <Column header="Statut" field="actif" sortable body={(d: Depart) => <Tag value={d.actif ? 'Actif' : 'Inactif'} severity={d.actif ? 'success' : 'secondary'} />} />
                <Column
                    header="Actions"
                    body={(d: Depart) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(d)} />
                            <Button
                                icon={d.actif ? 'pi pi-eye-slash' : 'pi pi-eye'}
                                rounded
                                text
                                severity={d.actif ? 'warning' : 'success'}
                                tooltip={d.actif ? 'Désactiver' : 'Activer'}
                                disabled={basculerActif.isPending}
                                onClick={() => basculerActif.mutate(d)}
                            />
                            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Supprimer" onClick={() => confirmerSuppression(d.libelle, () => supprimer.mutate(d))} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? 'Modifier le point de départ' : 'Nouveau point de départ'} visible={dialogOuvert} style={{ width: 'min(600px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <div className="form-grid">
                    <label className="span-2">
                        Site *
                        <Dropdown value={form.siteUuid} options={sitesOptions} onChange={(e) => setForm({ ...form, siteUuid: e.value })} placeholder="Sélectionner un site" filter loading={sitesQuery.isLoading} />
                        {sitesQuery.isError && <span className="texte-danger">Impossible de charger les sites (liste déroulante indisponible)</span>}
                    </label>
                    <label className="span-2">
                        Libellé *
                        <input value={form.libelle} placeholder="Ex: Quai A, Départ Bus Express…" onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
                    </label>
                    <label>
                        Ordre d'affichage
                        <input type="number" min={0} value={form.ordreAffichage} onChange={(e) => setForm({ ...form, ordreAffichage: e.target.value })} />
                        <span className="muted">Les départs sont triés par ordre croissant</span>
                    </label>
                    <label className="span-2">
                        Description
                        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button label={sauvegarder.isPending ? 'Enregistrement…' : enEdition ? 'Mettre à jour' : 'Créer'} icon="pi pi-check" disabled={!formValide || sauvegarder.isPending} onClick={() => sauvegarder.mutate()} />
                </div>
            </Dialog>
        </section>
    );
}
