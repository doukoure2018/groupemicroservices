import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocalisationLabel, TYPE_SITES, type Site, type SiteRequest } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useState } from 'react';
import { api } from '../../api';
import { confirmerSuppression, num, StatCarte, str, tronquer, useNotif } from './shared';

interface SiteForm {
    villeUuid: string;
    localisationUuid: string;
    nom: string;
    description: string;
    typeSite: string;
    capaciteVehicules: string;
    telephone: string;
    email: string;
    horaireOuverture: string;
    horaireFermeture: string;
    imageUrl: string;
}

const FORM_VIDE: SiteForm = {
    villeUuid: '',
    localisationUuid: '',
    nom: '',
    description: '',
    typeSite: 'GARE_ROUTIERE',
    capaciteVehicules: '',
    telephone: '',
    email: '',
    horaireOuverture: '',
    horaireFermeture: '',
    imageUrl: ''
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getTypeSiteLabel(type: string | undefined): string {
    return TYPE_SITES.find((t) => t.value === type)?.label ?? type ?? '-';
}

function getTypeSiteSeverity(type: string | undefined): 'success' | 'info' | 'warning' | 'secondary' {
    switch (type) {
        case 'GARE_ROUTIERE':
            return 'success';
        case 'AEROPORT':
        case 'PORT':
        case 'GARE_FERROVIAIRE':
            return 'info';
        case 'STATION':
        case 'ARRET':
            return 'warning';
        default:
            return 'secondary';
    }
}

export function SitesAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-sites'];

    const sitesQuery = useQuery({ queryKey: CLE, queryFn: async () => (await api.transport.sites()).data.sites });
    const villesQuery = useQuery({ queryKey: ['villes-actives'], queryFn: async () => (await api.geo.villesActives()).data.villes });
    const localisationsQuery = useQuery({ queryKey: ['localisations'], queryFn: async () => (await api.geo.localisations()).data.localisations });

    const [recherche, setRecherche] = useState('');
    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Site | null>(null);
    const [form, setForm] = useState<SiteForm>(FORM_VIDE);

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: CLE });
        void queryClient.invalidateQueries({ queryKey: ['sites-actifs'] });
    };

    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        const tous = sitesQuery.data ?? [];
        if (!q) return tous;
        return tous.filter((s) => [s.nom, s.villeLibelle, s.typeSite, s.adresseComplete].some((v) => v?.toLowerCase().includes(q)));
    }, [sitesQuery.data, recherche]);

    const stats = useMemo(() => {
        const tous = sitesQuery.data ?? [];
        const actifs = tous.filter((s) => s.actif).length;
        return { total: tous.length, actifs, inactifs: tous.length - actifs };
    }, [sitesQuery.data]);

    const villesOptions = useMemo(() => (villesQuery.data ?? []).map((v) => ({ label: `${v.libelle} (${v.regionLibelle})`, value: v.villeUuid })), [villesQuery.data]);
    const localisationsOptions = useMemo(
        () => (localisationsQuery.data ?? []).map((l) => ({ label: getLocalisationLabel(l), value: l.localisationUuid })),
        [localisationsQuery.data]
    );

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: SiteRequest = {
                localisationUuid: form.localisationUuid,
                villeUuid: form.villeUuid,
                nom: form.nom.trim(),
                description: form.description || undefined,
                typeSite: form.typeSite,
                capaciteVehicules: num(form.capaciteVehicules),
                telephone: form.telephone || undefined,
                email: form.email || undefined,
                horaireOuverture: form.horaireOuverture || undefined,
                horaireFermeture: form.horaireFermeture || undefined,
                imageUrl: form.imageUrl || undefined,
                actif: enEdition?.actif ?? true
            };
            return enEdition ? api.transport.updateSite(enEdition.siteUuid!, body) : api.transport.createSite(body);
        },
        onSuccess: () => {
            succes(enEdition ? 'Site mis à jour avec succès' : 'Site créé avec succès');
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, enEdition ? 'Impossible de mettre à jour le site' : 'Impossible de créer le site')
    });

    const basculerActif = useMutation({
        mutationFn: async (s: Site) => api.transport.toggleSiteActif(s.siteUuid!),
        onSuccess: (res) => {
            succes(res.data.site?.actif ? 'Site activé' : 'Site désactivé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de modifier le statut')
    });

    const supprimer = useMutation({
        mutationFn: async (s: Site) => api.transport.deleteSite(s.siteUuid!),
        onSuccess: () => {
            succes('Site supprimé avec succès');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de supprimer le site')
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(s: Site) {
        setEnEdition(s);
        setForm({
            villeUuid: s.villeUuid ?? '',
            localisationUuid: s.localisationUuid ?? '',
            nom: s.nom ?? '',
            description: s.description ?? '',
            typeSite: s.typeSite ?? 'GARE_ROUTIERE',
            capaciteVehicules: str(s.capaciteVehicules),
            telephone: s.telephone ?? '',
            email: s.email ?? '',
            horaireOuverture: (s.horaireOuverture ?? '').slice(0, 5),
            horaireFermeture: (s.horaireFermeture ?? '').slice(0, 5),
            imageUrl: s.imageUrl ?? ''
        });
        setDialogOuvert(true);
    }

    /** V35 : la ville du site est saisie directement ; on la pré-remplit depuis la localisation seulement si elle est vide. */
    function choisirLocalisation(uuid: string) {
        const loc = (localisationsQuery.data ?? []).find((l) => l.localisationUuid === uuid);
        setForm((f) => ({ ...f, localisationUuid: uuid, villeUuid: f.villeUuid || loc?.villeUuid || '' }));
    }

    const emailValide = !form.email || EMAIL_RE.test(form.email);
    const formValide = !!form.villeUuid && !!form.localisationUuid && form.nom.trim().length >= 2 && emailValide;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Sites &amp; Gares</h1>
                    <p className="muted">Gestion des sites, gares routières et points de transport</p>
                </div>
                <Button label="Nouveau site" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Total sites" valeur={stats.total} />
                <StatCarte libelle="Sites actifs" valeur={stats.actifs} ton="succes" />
                <StatCarte libelle="Sites inactifs" valeur={stats.inactifs} ton="alerte" />
            </div>

            <div className="barre-filtres">
                <input placeholder="Rechercher par nom, ville, type…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" onClick={rafraichir} />
            </div>

            {sitesQuery.isError && <p className="error">Impossible de charger les sites</p>}

            <DataTable value={liste} loading={sitesQuery.isLoading} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} size="small" stripedRows emptyMessage="Aucun site trouvé" scrollable>
                <Column
                    header="Nom"
                    field="nom"
                    sortable
                    body={(s: Site) => (
                        <div className="cellule-trajet">
                            <strong>{s.nom}</strong>
                            {s.telephone && <span className="muted">{s.telephone}</span>}
                        </div>
                    )}
                />
                <Column header="Type" field="typeSite" sortable body={(s: Site) => <Tag value={getTypeSiteLabel(s.typeSite)} severity={getTypeSiteSeverity(s.typeSite)} />} />
                <Column
                    header="Localisation"
                    body={(s: Site) => (
                        <div className="cellule-trajet">
                            <span>{tronquer(s.adresseComplete, 40) || '-'}</span>
                            {s.latitude != null && s.longitude != null && (
                                <span className="muted">
                                    {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                                </span>
                            )}
                        </div>
                    )}
                />
                <Column
                    header="Ville"
                    field="villeLibelle"
                    sortable
                    body={(s: Site) => (
                        <div className="cellule-trajet">
                            <span>{s.villeLibelle ?? '-'}</span>
                            {s.regionLibelle && <span className="muted">{s.regionLibelle}</span>}
                        </div>
                    )}
                />
                <Column header="Horaires" body={(s: Site) => `${(s.horaireOuverture ?? '--:--').slice(0, 5)} - ${(s.horaireFermeture ?? '--:--').slice(0, 5)}`} />
                <Column header="Capacité" body={(s: Site) => s.capaciteVehicules ?? '-'} />
                <Column header="Statut" field="actif" sortable body={(s: Site) => <Tag value={s.actif ? 'Actif' : 'Inactif'} severity={s.actif ? 'success' : 'secondary'} />} />
                <Column
                    header="Actions"
                    body={(s: Site) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(s)} />
                            <Button
                                icon={s.actif ? 'pi pi-eye-slash' : 'pi pi-eye'}
                                rounded
                                text
                                severity={s.actif ? 'warning' : 'success'}
                                tooltip={s.actif ? 'Désactiver' : 'Activer'}
                                disabled={basculerActif.isPending}
                                onClick={() => basculerActif.mutate(s)}
                            />
                            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Supprimer" onClick={() => confirmerSuppression(s.nom, () => supprimer.mutate(s))} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? 'Modifier le site' : 'Nouveau site'} visible={dialogOuvert} style={{ width: 'min(720px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <div className="form-grid">
                    <label>
                        Ville *
                        <Dropdown value={form.villeUuid} options={villesOptions} onChange={(e) => setForm({ ...form, villeUuid: e.value })} placeholder="Sélectionner une ville" filter loading={villesQuery.isLoading} />
                        {villesQuery.isError && <span className="texte-danger">Impossible de charger les villes (liste déroulante indisponible)</span>}
                    </label>
                    <label>
                        Localisation *
                        <Dropdown value={form.localisationUuid} options={localisationsOptions} onChange={(e) => choisirLocalisation(e.value)} placeholder="Sélectionner une localisation" filter loading={localisationsQuery.isLoading} />
                        {localisationsQuery.isError && <span className="texte-danger">Impossible de charger les localisations</span>}
                    </label>
                    <label>
                        Nom du site *
                        <input value={form.nom} placeholder="ex. Gare routière de Madina" onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                    </label>
                    <label>
                        Type de site
                        <Dropdown value={form.typeSite} options={TYPE_SITES.map((t) => ({ label: t.label, value: t.value }))} onChange={(e) => setForm({ ...form, typeSite: e.value })} />
                    </label>
                    <label>
                        Capacité (véhicules)
                        <input type="number" min={0} value={form.capaciteVehicules} onChange={(e) => setForm({ ...form, capaciteVehicules: e.target.value })} />
                    </label>
                    <label>
                        Téléphone
                        <input type="tel" maxLength={20} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                    </label>
                    <label>
                        Email
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        {!emailValide && <span className="texte-danger">Adresse email invalide.</span>}
                    </label>
                    <label>
                        Image (URL)
                        <input type="url" maxLength={255} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                    </label>
                    <label>
                        Heure d'ouverture
                        <input type="time" value={form.horaireOuverture} onChange={(e) => setForm({ ...form, horaireOuverture: e.target.value })} />
                    </label>
                    <label>
                        Heure de fermeture
                        <input type="time" value={form.horaireFermeture} onChange={(e) => setForm({ ...form, horaireFermeture: e.target.value })} />
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
