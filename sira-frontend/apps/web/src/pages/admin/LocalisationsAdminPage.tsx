import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type Localisation, type LocalisationUpdateRequest, type PlacePrediction } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useState } from 'react';
import { api } from '../../api';
import { confirmerSuppression, num, StatCarte, str, useNotif } from './shared';

interface LocForm {
    villeUuid: string;
    communeUuid: string;
    quartierUuid: string;
    adresseComplete: string;
    latitude: string;
    longitude: string;
    description: string;
    removeQuartier: boolean;
}

const FORM_VIDE: LocForm = { villeUuid: '', communeUuid: '', quartierUuid: '', adresseComplete: '', latitude: '', longitude: '', description: '', removeQuartier: false };

function urlOsm(lat: number, lon: number): string {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`;
}
function urlOsmEmbed(lat: number, lon: number): string {
    const d = 0.005;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`;
}

export function LocalisationsAdminPage() {
    const { toast, succes, erreur, info } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['localisations'];

    const locsQuery = useQuery({ queryKey: CLE, queryFn: async () => (await api.geo.localisations()).data.localisations ?? [] });
    const villesQuery = useQuery({ queryKey: ['villes'], queryFn: async () => (await api.geo.villes()).data.villes ?? [] });
    const communesQuery = useQuery({ queryKey: ['communes'], queryFn: async () => (await api.geo.communes()).data.communes ?? [] });
    const quartiersQuery = useQuery({ queryKey: ['quartiers'], queryFn: async () => (await api.geo.quartiers()).data.quartiers ?? [] });

    const villes = useMemo(() => (villesQuery.data ?? []).filter((v) => v.actif), [villesQuery.data]);
    const communes = useMemo(() => (communesQuery.data ?? []).filter((c) => c.actif), [communesQuery.data]);
    const quartiers = useMemo(() => (quartiersQuery.data ?? []).filter((q) => q.actif), [quartiersQuery.data]);

    // --- Filtres (un seul filtre appliqué par priorité quartier > commune > ville, comme dans l'Angular)
    const [recherche, setRecherche] = useState('');
    const [fVille, setFVille] = useState<string | null>(null);
    const [fCommune, setFCommune] = useState<string | null>(null);
    const [fQuartier, setFQuartier] = useState<string | null>(null);

    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        return (locsQuery.data ?? []).filter((l) => {
            if (fQuartier) {
                if (l.quartierUuid !== fQuartier) return false;
            } else if (fCommune) {
                if (l.communeUuid !== fCommune) return false;
            } else if (fVille) {
                if (l.villeUuid !== fVille) return false;
            }
            if (!q) return true;
            return [l.adresseComplete, l.description, l.quartierLibelle, l.communeLibelle, l.villeLibelle, l.regionLibelle].some((v) => v?.toLowerCase().includes(q));
        });
    }, [locsQuery.data, recherche, fVille, fCommune, fQuartier]);

    const stats = useMemo(() => {
        const tous = locsQuery.data ?? [];
        return {
            total: tous.length,
            avecQuartier: tous.filter((l) => l.quartierUuid).length,
            avecGps: tous.filter((l) => l.latitude !== null && l.longitude !== null).length,
            quartiers: (quartiersQuery.data ?? []).length
        };
    }, [locsQuery.data, quartiersQuery.data]);

    const villesOptions = useMemo(() => villes.map((v) => ({ label: v.libelle, value: v.villeUuid })), [villes]);
    const communesFiltre = useMemo(() => communes.filter((c) => !fVille || c.villeUuid === fVille).map((c) => ({ label: c.libelle, value: c.communeUuid })), [communes, fVille]);
    const quartiersFiltre = useMemo(
        () => quartiers.filter((q) => (fCommune ? q.communeUuid === fCommune : fVille ? q.villeUuid === fVille : true)).map((q) => ({ label: q.libelle, value: q.quartierUuid })),
        [quartiers, fVille, fCommune]
    );
    const filtresActifs = !!recherche || !!fVille || !!fCommune || !!fQuartier;
    function effacerFiltres() {
        setRecherche('');
        setFVille(null);
        setFCommune(null);
        setFQuartier(null);
    }

    // --- Formulaire
    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Localisation | null>(null);
    const [form, setForm] = useState<LocForm>(FORM_VIDE);
    const [rechercheOsm, setRechercheOsm] = useState('');
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [rechercheFaite, setRechercheFaite] = useState(false);

    const communesModal = useMemo(() => communes.filter((c) => !form.villeUuid || c.villeUuid === form.villeUuid).map((c) => ({ label: c.libelle, value: c.communeUuid })), [communes, form.villeUuid]);
    const quartiersModal = useMemo(
        () => quartiers.filter((q) => (form.communeUuid ? q.communeUuid === form.communeUuid : form.villeUuid ? q.villeUuid === form.villeUuid : true)).map((q) => ({ label: q.libelle, value: q.quartierUuid })),
        [quartiers, form.villeUuid, form.communeUuid]
    );

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setRechercheOsm('');
        setSuggestions([]);
        setRechercheFaite(false);
        setDialogOuvert(true);
    }

    function ouvrirEdition(l: Localisation) {
        setEnEdition(l);
        setForm({
            villeUuid: l.villeUuid ?? '',
            communeUuid: l.communeUuid ?? '',
            quartierUuid: l.quartierUuid ?? '',
            adresseComplete: l.adresseComplete ?? '',
            latitude: str(l.latitude),
            longitude: str(l.longitude),
            description: l.description ?? '',
            removeQuartier: false
        });
        setRechercheOsm('');
        setSuggestions([]);
        setRechercheFaite(false);
        setDialogOuvert(true);
    }

    const chercherOsm = useMutation({
        mutationFn: async (q: string) => (await api.geo.osmGuinea(q, 10)).data.predictions ?? [],
        onSuccess: (preds, q) => {
            setSuggestions(preds);
            setRechercheFaite(true);
            if (preds.length) succes(`${preds.length} résultat(s) trouvé(s)`);
            else info(`Aucun résultat trouvé pour « ${q} »`);
        },
        onError: (err) => erreur(err, 'Erreur lors de la recherche')
    });

    function lancerRechercheOsm() {
        const q = rechercheOsm.trim();
        if (q.length < 2) {
            erreur(undefined, 'Entrez au moins 2 caractères pour rechercher');
            return;
        }
        chercherOsm.mutate(q);
    }

    function choisirAdresse(p: PlacePrediction) {
        setForm((f) => ({ ...f, adresseComplete: p.description, latitude: str(p.latitude), longitude: str(p.longitude) }));
        setSuggestions([]);
        setRechercheOsm('');
        if (p.latitude != null && p.longitude != null) succes('Adresse sélectionnée avec coordonnées GPS');
        else info('Adresse sélectionnée (sans coordonnées GPS)');
    }

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: LocalisationUpdateRequest = {
                quartierUuid: form.quartierUuid || null,
                adresseComplete: form.adresseComplete.trim(),
                latitude: num(form.latitude) ?? null,
                longitude: num(form.longitude) ?? null,
                description: form.description || null
            };
            if (enEdition) return api.geo.updateLocalisation(enEdition.localisationUuid, { ...body, removeQuartier: form.removeQuartier && !form.quartierUuid });
            return api.geo.createLocalisation(body);
        },
        onSuccess: (res) => {
            succes('Succès', res.message || (enEdition ? 'Localisation modifiée' : 'Localisation créée'));
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'enregistrement de la localisation a échoué.")
    });

    function soumettre() {
        if (!form.quartierUuid || form.removeQuartier) {
            confirmDialog({
                header: 'Localisation sans quartier',
                icon: 'pi pi-exclamation-triangle',
                message:
                    "Aucun quartier n'est rattaché à cette localisation. Les sites/gares qui l'utiliseront ne remonteront pas dans les recherches par ville (site web et application mobile). Voulez-vous quand même enregistrer ?",
                acceptLabel: 'Enregistrer sans quartier',
                rejectLabel: 'Revenir au formulaire',
                acceptClassName: 'p-button-warning',
                accept: () => sauvegarder.mutate()
            });
            return;
        }
        sauvegarder.mutate();
    }

    const supprimer = useMutation({
        mutationFn: async (l: Localisation) => api.geo.deleteLocalisation(l.localisationUuid),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Localisation supprimée');
            rafraichir();
        },
        onError: (err) => erreur(err, 'La suppression a échoué (localisation utilisée par un site ?).')
    });

    // --- Carte
    const [carteDe, setCarteDe] = useState<Localisation | null>(null);

    const gpsForm = num(form.latitude) !== undefined && num(form.longitude) !== undefined;
    const formValide = form.adresseComplete.trim().length >= 5 && form.adresseComplete.length <= 500 && form.description.length <= 1000;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Gestion des Localisations</h1>
                    <p className="muted">Gérez les adresses et points GPS — propulsé par OpenStreetMap</p>
                </div>
                <Button label="Nouvelle localisation" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Total localisations" valeur={stats.total} />
                <StatCarte libelle="Avec quartier" valeur={stats.avecQuartier} ton="succes" />
                <StatCarte libelle="Avec GPS" valeur={stats.avecGps} />
                <StatCarte libelle="Quartiers" valeur={stats.quartiers} />
            </div>

            <div className="barre-filtres">
                <input placeholder="Rechercher une localisation..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Dropdown
                    value={fVille}
                    options={villesOptions}
                    onChange={(e) => {
                        setFVille(e.value ?? null);
                        setFCommune(null);
                        setFQuartier(null);
                    }}
                    placeholder="Filtrer par ville"
                    filter
                    showClear
                    className="filtre-dropdown"
                />
                <Dropdown
                    value={fCommune}
                    options={communesFiltre}
                    onChange={(e) => {
                        setFCommune(e.value ?? null);
                        setFQuartier(null);
                    }}
                    placeholder="Filtrer par commune"
                    filter
                    showClear
                    className="filtre-dropdown"
                />
                <Dropdown value={fQuartier} options={quartiersFiltre} onChange={(e) => setFQuartier(e.value ?? null)} placeholder="Filtrer par quartier" filter showClear className="filtre-dropdown" />
                {filtresActifs && <Button label="Effacer les filtres" icon="pi pi-filter-slash" text onClick={effacerFiltres} />}
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" onClick={rafraichir} />
            </div>

            {locsQuery.isError && <p className="error">Impossible de charger les localisations.</p>}

            <DataTable value={liste} loading={locsQuery.isLoading} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} size="small" stripedRows emptyMessage="Aucune localisation trouvée" scrollable>
                <Column
                    header="Adresse"
                    field="adresseComplete"
                    sortable
                    body={(l: Localisation) => (
                        <div className="cellule-trajet">
                            <strong>{l.adresseComplete}</strong>
                            {l.description && <span className="muted">{l.description}</span>}
                        </div>
                    )}
                />
                <Column header="Quartier" field="quartierLibelle" sortable body={(l: Localisation) => l.quartierLibelle ?? '-'} />
                <Column header="Commune" field="communeLibelle" sortable body={(l: Localisation) => l.communeLibelle ?? '-'} />
                <Column header="Ville" field="villeLibelle" sortable body={(l: Localisation) => l.villeLibelle ?? '-'} />
                <Column
                    header="GPS"
                    body={(l: Localisation) =>
                        l.latitude !== null && l.longitude !== null ? (
                            <Button icon="pi pi-map" rounded text tooltip="Voir sur la carte" onClick={() => setCarteDe(l)} />
                        ) : (
                            <Tag value="Non" severity="secondary" />
                        )
                    }
                />
                <Column header="Créée le" field="createdAt" sortable body={(l: Localisation) => formatDateFr(l.createdAt)} />
                <Column
                    header="Actions"
                    body={(l: Localisation) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(l)} />
                            {l.latitude !== null && l.longitude !== null && (
                                <Button icon="pi pi-external-link" rounded text severity="info" tooltip="Ouvrir dans OpenStreetMap" onClick={() => window.open(urlOsm(l.latitude!, l.longitude!), '_blank', 'noopener')} />
                            )}
                            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Supprimer" onClick={() => confirmerSuppression(l.adresseComplete, () => supprimer.mutate(l))} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? 'Modifier la localisation' : 'Nouvelle localisation'} visible={dialogOuvert} style={{ width: 'min(760px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <h3 className="section-titre">Hiérarchie géographique (optionnel)</h3>
                <div className="form-grid">
                    <label>
                        Ville
                        <Dropdown value={form.villeUuid || null} options={villesOptions} onChange={(e) => setForm({ ...form, villeUuid: e.value ?? '', communeUuid: '', quartierUuid: '' })} placeholder="Sélectionner une ville" filter showClear />
                    </label>
                    <label>
                        Commune
                        <Dropdown value={form.communeUuid || null} options={communesModal} onChange={(e) => setForm({ ...form, communeUuid: e.value ?? '', quartierUuid: '' })} placeholder="Sélectionner une commune" filter showClear />
                    </label>
                    <label className="span-2">
                        Quartier
                        <Dropdown value={form.quartierUuid || null} options={quartiersModal} onChange={(e) => setForm({ ...form, quartierUuid: e.value ?? '', removeQuartier: false })} placeholder="Sélectionner un quartier" filter showClear />
                        {!form.quartierUuid && <span className="muted">Sans quartier, les sites/gares rattachés à cette localisation n'apparaîtront pas dans les recherches par ville.</span>}
                        {enEdition?.quartierUuid && form.quartierUuid && (
                            <Button label="Retirer le quartier" icon="pi pi-times" text severity="danger" size="small" className="auto-largeur" onClick={() => setForm({ ...form, quartierUuid: '', removeQuartier: true })} />
                        )}
                    </label>
                </div>

                <h3 className="section-titre">Adresse (OpenStreetMap)</h3>
                <div className="form-grid">
                    <label className="span-2">
                        Rechercher une adresse
                        <div className="ligne-recherche">
                            <input
                                value={rechercheOsm}
                                placeholder="Tapez une adresse (ex: Nongo, Banque Islamique, Marché Madina...)"
                                onChange={(e) => setRechercheOsm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        lancerRechercheOsm();
                                    }
                                }}
                            />
                            <Button icon="pi pi-search" loading={chercherOsm.isPending} onClick={lancerRechercheOsm} tooltip="Rechercher" />
                        </div>
                        {chercherOsm.isPending && <span className="muted">Recherche OpenStreetMap en cours...</span>}
                    </label>
                    {suggestions.length > 0 && (
                        <div className="span-2 suggestions-osm">
                            <span className="muted">Résultats ({suggestions.length}) — cliquez pour sélectionner</span>
                            <ul>
                                {suggestions.map((p) => (
                                    <li key={p.placeId}>
                                        <button type="button" onClick={() => choisirAdresse(p)}>
                                            <span>{p.description}</span>
                                            {p.latitude != null && p.longitude != null && (
                                                <span className="muted">
                                                    📍 {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {rechercheFaite && suggestions.length === 0 && !chercherOsm.isPending && (
                        <p className="span-2 muted">
                            Aucun résultat trouvé. Essayez un autre terme ou{' '}
                            <a href="https://www.openstreetmap.org/edit" target="_blank" rel="noopener noreferrer">
                                ajoutez le lieu sur OpenStreetMap
                            </a>
                            .
                        </p>
                    )}
                    <label className="span-2">
                        Adresse sélectionnée *
                        <textarea rows={2} maxLength={500} value={form.adresseComplete} placeholder="L'adresse apparaîtra ici après sélection..." onChange={(e) => setForm({ ...form, adresseComplete: e.target.value })} />
                    </label>
                </div>

                <h3 className="section-titre">
                    Coordonnées GPS <Tag value={gpsForm ? '✓ Récupérées' : 'Non définies'} severity={gpsForm ? 'success' : 'secondary'} />
                </h3>
                <div className="form-grid">
                    <label>
                        Latitude
                        <input type="number" step="any" min={-90} max={90} placeholder="Ex: 9.6412" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                    </label>
                    <label>
                        Longitude
                        <input type="number" step="any" min={-180} max={180} placeholder="Ex: -13.5784" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                    </label>
                    <span className="span-2 muted">Les coordonnées sont auto-remplies lors de la sélection, ou saisissez-les manuellement.</span>
                </div>

                <h3 className="section-titre">Informations complémentaires</h3>
                <div className="form-grid">
                    <label className="span-2">
                        Description
                        <textarea rows={2} maxLength={1000} value={form.description} placeholder="Description ou repère (ex: En face du marché, près de la mosquée...)" onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                </div>

                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button label={enEdition ? 'Modifier' : 'Créer'} icon="pi pi-check" loading={sauvegarder.isPending} disabled={!formValide || sauvegarder.isPending} onClick={soumettre} />
                </div>
            </Dialog>

            <Dialog header="Localisation sur la carte" visible={!!carteDe} style={{ width: 'min(720px, 95vw)' }} onHide={() => setCarteDe(null)} modal>
                {carteDe && carteDe.latitude !== null && carteDe.longitude !== null && (
                    <div className="carte-detail">
                        <p>
                            <strong>{carteDe.adresseComplete}</strong>
                            {carteDe.description && <span className="muted"> — {carteDe.description}</span>}
                        </p>
                        <p className="muted">
                            Latitude : {carteDe.latitude} · Longitude : {carteDe.longitude}
                            {carteDe.quartierLibelle && (
                                <>
                                    <br />
                                    {[carteDe.quartierLibelle, carteDe.communeLibelle, carteDe.villeLibelle, carteDe.regionLibelle].filter(Boolean).join(' → ')}
                                </>
                            )}
                        </p>
                        <iframe title="Carte OpenStreetMap" src={urlOsmEmbed(carteDe.latitude, carteDe.longitude)} loading="lazy" className="carte-iframe" />
                        <div className="dialog-actions">
                            <span className="muted">© OpenStreetMap contributors</span>
                            <Button label="Ouvrir dans OpenStreetMap" icon="pi pi-external-link" outlined onClick={() => window.open(urlOsm(carteDe.latitude!, carteDe.longitude!), '_blank', 'noopener')} />
                        </div>
                    </div>
                )}
            </Dialog>
        </section>
    );
}
