import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Arrivee, ArriveeRequest } from '@sira/core';
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

interface ArriveeForm {
    departUuid: string;
    libelleDepart: string;
    siteUuid: string;
    libelle: string;
    description: string;
    ordreAffichage: string;
}

const FORM_VIDE: ArriveeForm = { departUuid: '', libelleDepart: '', siteUuid: '', libelle: '', description: '', ordreAffichage: '0' };

export function ArriveesAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-arrivees'];

    const arriveesQuery = useQuery({ queryKey: CLE, queryFn: async () => (await api.transport.arrivees()).data.arrivees });
    const departsQuery = useQuery({ queryKey: ['admin-departs-actifs'], queryFn: async () => (await api.transport.departsActifs()).data.departs });
    const sitesQuery = useQuery({ queryKey: ['sites-actifs'], queryFn: async () => (await api.transport.sitesActifs()).data.sites });

    const [recherche, setRecherche] = useState('');
    const [filtreDepart, setFiltreDepart] = useState<string | null>(null);
    const [filtreSite, setFiltreSite] = useState<string | null>(null);
    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Arrivee | null>(null);
    const [form, setForm] = useState<ArriveeForm>(FORM_VIDE);

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: CLE });
        void queryClient.invalidateQueries({ queryKey: ['arrivees-du-depart'] });
    };

    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        return (arriveesQuery.data ?? []).filter((a) => {
            if (filtreDepart && a.departUuid !== filtreDepart) return false;
            if (filtreSite && a.siteUuid !== filtreSite) return false;
            if (!q) return true;
            return [a.libelle, a.siteNom, a.villeLibelle, a.departSiteNom, a.departVilleLibelle].some((v) => v?.toLowerCase().includes(q));
        });
    }, [arriveesQuery.data, recherche, filtreDepart, filtreSite]);

    const stats = useMemo(() => {
        const tous = arriveesQuery.data ?? [];
        return { total: tous.length, actives: tous.filter((a) => a.actif).length, departs: (departsQuery.data ?? []).length };
    }, [arriveesQuery.data, departsQuery.data]);

    const departsOptions = useMemo(
        () => (departsQuery.data ?? []).map((d) => ({ label: `${d.libelle} — ${d.siteNom ?? '?'} · ${d.villeLibelle ?? '?'}`, value: d.departUuid })),
        [departsQuery.data]
    );
    const departChoisi = useMemo(() => (departsQuery.data ?? []).find((d) => d.departUuid === form.departUuid), [departsQuery.data, form.departUuid]);

    // Le site d'arrivée ne peut pas être le site du départ choisi.
    const sitesOptions = useMemo(
        () =>
            (sitesQuery.data ?? [])
                .filter((s) => !departChoisi || s.siteUuid !== departChoisi.siteUuid)
                .map((s) => ({ label: `${s.nom} — ${s.villeLibelle ?? '?'} · ${getTypeSiteLabel(s.typeSite)}`, value: s.siteUuid })),
        [sitesQuery.data, departChoisi]
    );
    const sitesFiltreOptions = useMemo(() => (sitesQuery.data ?? []).map((s) => ({ label: `${s.nom} — ${s.villeLibelle ?? '?'}`, value: s.siteUuid })), [sitesQuery.data]);

    const sauvegarder = useMutation({
        mutationFn: async () => {
            if (departChoisi && departChoisi.siteUuid === form.siteUuid) {
                throw new Error("Le site d'arrivée doit être différent du site de départ");
            }
            const body: ArriveeRequest = {
                siteUuid: form.siteUuid,
                departUuid: form.departUuid,
                libelle: form.libelle.trim(),
                libelleDepart: form.libelleDepart || undefined,
                description: form.description || undefined,
                ordreAffichage: num(form.ordreAffichage) ?? 0,
                actif: enEdition?.actif ?? true
            };
            return enEdition ? api.transport.updateArrivee(enEdition.arriveeUuid!, body) : api.transport.createArrivee(body);
        },
        onSuccess: () => {
            succes(enEdition ? "Point d'arrivée mis à jour avec succès" : "Point d'arrivée créé avec succès");
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, err instanceof Error ? err.message : "Impossible d'enregistrer le point d'arrivée")
    });

    const basculerActif = useMutation({
        mutationFn: async (a: Arrivee) => api.transport.toggleArriveeActif(a.arriveeUuid!),
        onSuccess: (res) => {
            succes(res.data.arrivee?.actif ? "Point d'arrivée activé" : "Point d'arrivée désactivé");
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de modifier le statut')
    });

    const supprimer = useMutation({
        mutationFn: async (a: Arrivee) => api.transport.deleteArrivee(a.arriveeUuid!),
        onSuccess: () => {
            succes("Point d'arrivée supprimé avec succès");
            rafraichir();
        },
        onError: (err) => erreur(err, "Impossible de supprimer le point d'arrivée")
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(a: Arrivee) {
        setEnEdition(a);
        setForm({
            departUuid: a.departUuid ?? '',
            libelleDepart: a.libelleDepart ?? '',
            siteUuid: a.siteUuid ?? '',
            libelle: a.libelle ?? '',
            description: a.description ?? '',
            ordreAffichage: str(a.ordreAffichage ?? 0)
        });
        setDialogOuvert(true);
    }

    /** Hors édition, le libellé d'origine est recopié depuis le départ choisi (comme dans l'Angular). */
    function choisirDepart(uuid: string) {
        const d = (departsQuery.data ?? []).find((x) => x.departUuid === uuid);
        setForm((f) => ({ ...f, departUuid: uuid, libelleDepart: enEdition ? f.libelleDepart : (d?.libelle ?? ''), siteUuid: d && f.siteUuid === d.siteUuid ? '' : f.siteUuid }));
    }

    const filtresActifs = !!recherche || !!filtreDepart || !!filtreSite;
    const memeSite = !!departChoisi && departChoisi.siteUuid === form.siteUuid;
    const formValide = !!form.departUuid && !!form.siteUuid && form.libelle.trim().length >= 2 && !memeSite;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Points d'arrivée</h1>
                    <p className="muted">Gestion des destinations pour chaque point de départ</p>
                </div>
                <Button label="Nouvelle arrivée" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Total arrivées" valeur={stats.total} />
                <StatCarte libelle="Arrivées actives" valeur={stats.actives} ton="succes" />
                <StatCarte libelle="Départs disponibles" valeur={stats.departs} />
            </div>

            <div className="barre-filtres">
                <input placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Dropdown value={filtreDepart} options={departsOptions} onChange={(e) => setFiltreDepart(e.value ?? null)} placeholder="Filtrer par départ" filter showClear className="filtre-dropdown" />
                <Dropdown value={filtreSite} options={sitesFiltreOptions} onChange={(e) => setFiltreSite(e.value ?? null)} placeholder="Filtrer par site d'arrivée" filter showClear className="filtre-dropdown" />
                {filtresActifs && (
                    <Button
                        label="Effacer filtres"
                        icon="pi pi-filter-slash"
                        text
                        onClick={() => {
                            setRecherche('');
                            setFiltreDepart(null);
                            setFiltreSite(null);
                        }}
                    />
                )}
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" onClick={rafraichir} />
            </div>

            {arriveesQuery.isError && <p className="error">Impossible de charger les points d'arrivée</p>}

            <DataTable value={liste} loading={arriveesQuery.isLoading} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} size="small" stripedRows emptyMessage="Aucun point d'arrivée trouvé" scrollable>
                <Column
                    header="Libellé"
                    field="libelle"
                    sortable
                    body={(a: Arrivee) => (
                        <div className="cellule-trajet">
                            <strong>{a.libelle}</strong>
                            {a.description && <span className="muted">{tronquer(a.description, 40)}</span>}
                        </div>
                    )}
                />
                <Column
                    header="Départ (origine)"
                    body={(a: Arrivee) => (
                        <div className="cellule-trajet">
                            <span>{a.departSiteNom ?? '-'}</span>
                            <span className="muted">{[a.departVilleLibelle, a.libelleDepart].filter(Boolean).join(' · ')}</span>
                        </div>
                    )}
                />
                <Column
                    header="Arrivée (destination)"
                    body={(a: Arrivee) => (
                        <div className="cellule-trajet">
                            <span>{a.siteNom ?? '-'}</span>
                            <span className="muted">{[a.villeLibelle, tronquer(a.adresseComplete, 30)].filter(Boolean).join(' · ')}</span>
                        </div>
                    )}
                />
                <Column header="Ordre" field="ordreAffichage" sortable body={(a: Arrivee) => <Badge value={a.ordreAffichage ?? 0} severity="secondary" />} />
                <Column header="Statut" field="actif" sortable body={(a: Arrivee) => <Tag value={a.actif ? 'Actif' : 'Inactif'} severity={a.actif ? 'success' : 'secondary'} />} />
                <Column
                    header="Actions"
                    body={(a: Arrivee) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(a)} />
                            <Button
                                icon={a.actif ? 'pi pi-eye-slash' : 'pi pi-eye'}
                                rounded
                                text
                                severity={a.actif ? 'warning' : 'success'}
                                tooltip={a.actif ? 'Désactiver' : 'Activer'}
                                disabled={basculerActif.isPending}
                                onClick={() => basculerActif.mutate(a)}
                            />
                            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Supprimer" onClick={() => confirmerSuppression(a.libelle, () => supprimer.mutate(a))} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? "Modifier le point d'arrivée" : "Nouveau point d'arrivée"} visible={dialogOuvert} style={{ width: 'min(640px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <h3 className="section-titre">Point de départ (origine)</h3>
                <div className="form-grid">
                    <label className="span-2">
                        Point de départ *
                        <Dropdown value={form.departUuid} options={departsOptions} onChange={(e) => choisirDepart(e.value)} placeholder="Sélectionner un point de départ" filter loading={departsQuery.isLoading} />
                        {departsQuery.isError && <span className="texte-danger">Impossible de charger les points de départ (liste déroulante indisponible)</span>}
                    </label>
                    <label className="span-2">
                        Libellé affiché comme origine
                        <input maxLength={100} value={form.libelleDepart} onChange={(e) => setForm({ ...form, libelleDepart: e.target.value })} />
                        <span className="muted">Ce libellé sera affiché comme origine du trajet</span>
                    </label>
                </div>
                <h3 className="section-titre">Point d'arrivée (destination)</h3>
                <div className="form-grid">
                    <label className="span-2">
                        Site d'arrivée *
                        <Dropdown value={form.siteUuid} options={sitesOptions} onChange={(e) => setForm({ ...form, siteUuid: e.value })} placeholder="Sélectionner un site" filter loading={sitesQuery.isLoading} />
                        {sitesQuery.isError && <span className="texte-danger">Impossible de charger les sites (liste déroulante indisponible)</span>}
                        {memeSite && <span className="texte-danger">Le site d'arrivée doit être différent du site de départ</span>}
                    </label>
                    <label className="span-2">
                        Libellé *
                        <input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
                    </label>
                    <label>
                        Ordre d'affichage
                        <input type="number" min={0} value={form.ordreAffichage} onChange={(e) => setForm({ ...form, ordreAffichage: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Description
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
