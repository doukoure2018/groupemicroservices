import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr } from '@sira/core';
import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useState, type KeyboardEvent, type ClipboardEvent } from 'react';
import { StatCarte, useNotif } from './shared';

/**
 * CRUD générique des référentiels géographiques (régions, villes, communes, quartiers).
 * Port du `ReferentielCrudComponent` Angular : config déclarative + adaptateur API.
 */

export interface OptionRef {
    label: string;
    value: string;
    /** Champs supplémentaires utilisés par les cascades (ex. villeUuid d'une commune). */
    [k: string]: string | undefined;
}

export interface ChampConfig {
    key: string;
    label: string;
    type: 'text' | 'dropdown';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
    options?: OptionRef[];
    /** Le champ est vidé quand `champ` change ; ses options sont filtrées sur `option[matchKey] === valeur du parent`. */
    dependsOn?: { champ: string; matchKey: string };
    /** Champ d'aide à la saisie, jamais envoyé au backend. */
    exclu?: boolean;
}

export interface ColonneConfig<T> {
    header: string;
    key: keyof T & string;
    subKey?: keyof T & string;
    type?: 'text' | 'badge' | 'date';
}

export interface FiltreConfig<T> {
    placeholder: string;
    rowKey: keyof T & string;
    options: OptionRef[];
    dependsOn?: { filtre: number; matchKey: string };
}

export interface ReferentielConfig<T> {
    titre: string;
    sousTitre: string;
    entite: string;
    entitePluriel: string;
    genre: 'f' | 'm';
    queryKey: string;
    uuidKey: keyof T & string;
    libelleKey: keyof T & string;
    colonnes: ColonneConfig<T>[];
    champs: ChampConfig[];
    filtres?: FiltreConfig<T>[];
    rechercheKeys: (keyof T & string)[];
    saisieParLot?: boolean;
    /** Clés de cache TanStack à invalider en plus (listes « actives » consommées par d'autres écrans). */
    invalider?: string[][];
}

export interface ReferentielApi<T> {
    list(): Promise<T[]>;
    create(body: Record<string, string>): Promise<T | undefined>;
    update(uuid: string, body: Record<string, string>): Promise<T | undefined>;
    setActif(uuid: string, actif: boolean): Promise<T | undefined>;
}

type Ligne = { actif?: boolean };

function val<T>(row: T, key: string): unknown {
    return (row as unknown as Record<string, unknown>)[key];
}

interface LigneLot {
    libelle: string;
    statut: 'attente' | 'cree' | 'ignore' | 'erreur';
    detail?: string;
}

const ICONES_LOT: Record<LigneLot['statut'], string> = {
    attente: 'pi pi-circle',
    cree: 'pi pi-check-circle',
    ignore: 'pi pi-minus-circle',
    erreur: 'pi pi-times-circle'
};

export function ReferentielCrud<T extends Ligne>({ config, api }: { config: ReferentielConfig<T>; api: ReferentielApi<T> }) {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const fem = config.genre === 'f';
    const article = fem ? 'la' : 'le';
    const nouveau = fem ? 'Nouvelle' : 'Nouveau';

    const listeQuery = useQuery({ queryKey: [config.queryKey], queryFn: api.list });

    const [recherche, setRecherche] = useState('');
    const [filtres, setFiltres] = useState<(string | null)[]>(() => (config.filtres ?? []).map(() => null));
    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<T | null>(null);
    const [form, setForm] = useState<Record<string, string>>({});
    const [touche, setTouche] = useState<Record<string, boolean>>({});

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: [config.queryKey] });
        for (const cle of config.invalider ?? []) void queryClient.invalidateQueries({ queryKey: cle });
    };

    // --- Liste filtrée
    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        return (listeQuery.data ?? []).filter((row) => {
            for (let i = 0; i < (config.filtres ?? []).length; i++) {
                const f = config.filtres?.[i];
                if (f && filtres[i] && val(row, f.rowKey) !== filtres[i]) return false;
            }
            if (!q) return true;
            return config.rechercheKeys.some((k) => String(val(row, k) ?? '').toLowerCase().includes(q));
        });
    }, [listeQuery.data, recherche, filtres, config]);

    const stats = useMemo(() => {
        const tous = listeQuery.data ?? [];
        const actifs = tous.filter((r) => r.actif).length;
        return { total: tous.length, actifs, inactifs: tous.length - actifs };
    }, [listeQuery.data]);

    function optionsFiltre(i: number): OptionRef[] {
        const f = config.filtres?.[i];
        if (!f) return [];
        const dep = f.dependsOn;
        if (!dep) return f.options;
        const parent = filtres[dep.filtre];
        return parent ? f.options.filter((o) => o[dep.matchKey] === parent) : f.options;
    }

    function changerFiltre(i: number, valeur: string | null) {
        setFiltres((prev) => {
            const next = [...prev];
            next[i] = valeur;
            (config.filtres ?? []).forEach((f, j) => {
                if (f.dependsOn?.filtre === i) next[j] = null;
            });
            return next;
        });
    }

    const filtresActifs = !!recherche || filtres.some(Boolean);

    // --- Formulaire
    function formVide(): Record<string, string> {
        return Object.fromEntries(config.champs.map((c) => [c.key, '']));
    }

    function optionsChamp(c: ChampConfig, valeurs: Record<string, string>): OptionRef[] {
        const dep = c.dependsOn;
        if (!dep || !c.options) return c.options ?? [];
        const parent = valeurs[dep.champ];
        return parent ? c.options.filter((o) => o[dep.matchKey] === parent) : c.options;
    }

    function changerChamp(key: string, valeur: string) {
        setForm((prev) => {
            const next = { ...prev, [key]: valeur };
            for (const c of config.champs) if (c.dependsOn?.champ === key) next[c.key] = '';
            return next;
        });
    }

    function erreurChamp(c: ChampConfig, valeurs: Record<string, string>): string | null {
        const v = (valeurs[c.key] ?? '').trim();
        if (c.required && !v) return 'Ce champ est obligatoire';
        if (c.minLength && v && v.length < c.minLength) return `Minimum ${c.minLength} caractères`;
        if (c.maxLength && v.length > c.maxLength) return `Maximum ${c.maxLength} caractères`;
        return null;
    }

    const formValide = config.champs.every((c) => !erreurChamp(c, form));

    function payload(valeurs: Record<string, string>): Record<string, string> {
        const body: Record<string, string> = {};
        for (const c of config.champs) {
            if (c.exclu) continue;
            const v = valeurs[c.key]?.trim();
            if (v) body[c.key] = v;
        }
        return body;
    }

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(formVide());
        setTouche({});
        setDialogOuvert(true);
    }

    function ouvrirEdition(row: T) {
        setEnEdition(row);
        const valeurs = formVide();
        for (const c of config.champs) valeurs[c.key] = String(val(row, c.key) ?? '');
        setForm(valeurs);
        setTouche({});
        setDialogOuvert(true);
    }

    const sauvegarder = useMutation({
        mutationFn: async () => (enEdition ? api.update(String(val(enEdition, config.uuidKey)), payload(form)) : api.create(payload(form))),
        onSuccess: () => {
            succes('Succès', enEdition ? `${capitaliser(config.entite)} ${fem ? 'modifiée' : 'modifié'}` : `${capitaliser(config.entite)} ${fem ? 'créée' : 'créé'}`);
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    const basculer = useMutation({
        mutationFn: async (row: T) => api.setActif(String(val(row, config.uuidKey)), !row.actif),
        onSuccess: (_r, row) => {
            succes('Succès', `${capitaliser(config.entite)} ${row.actif ? 'désactivé' : 'activé'}${fem ? 'e' : ''}`);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    function confirmerBascule(row: T) {
        confirmDialog({
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            message: `Êtes-vous sûr de vouloir ${row.actif ? 'désactiver' : 'activer'} ${article} ${config.entite} « ${String(val(row, config.libelleKey))} » ?`,
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => basculer.mutate(row)
        });
    }

    // --- Saisie en lot
    const [lotOuvert, setLotOuvert] = useState(false);
    const [lotForm, setLotForm] = useState<Record<string, string>>({});
    const [lotLibelles, setLotLibelles] = useState<string[]>([]);
    const [lotSaisie, setLotSaisie] = useState('');
    const [lotLignes, setLotLignes] = useState<LigneLot[]>([]);
    const [lotEnCours, setLotEnCours] = useState(false);
    const champsLot = config.champs.filter((c) => c.type === 'dropdown');
    const champLibelle = config.champs.find((c) => c.type === 'text' && c.required);

    function ouvrirLot() {
        setLotForm(formVide());
        setLotLibelles([]);
        setLotSaisie('');
        setLotLignes([]);
        setLotOuvert(true);
    }

    function ajouterLibelles(texte: string) {
        const nouveaux = texte
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
        setLotLibelles((prev) => {
            const vus = new Set(prev.map((s) => s.toLowerCase()));
            const out = [...prev];
            for (const n of nouveaux) {
                if (!vus.has(n.toLowerCase())) {
                    vus.add(n.toLowerCase());
                    out.push(n);
                }
            }
            return out;
        });
    }

    function lotKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            ajouterLibelles(lotSaisie);
            setLotSaisie('');
        } else if (e.key === 'Backspace' && !lotSaisie) {
            setLotLibelles((prev) => prev.slice(0, -1));
        }
    }

    function lotPaste(e: ClipboardEvent<HTMLInputElement>) {
        const texte = e.clipboardData.getData('text');
        if (texte.includes('\n')) {
            e.preventDefault();
            ajouterLibelles(texte);
        }
    }

    const nbLot = lotLibelles.length + (lotSaisie.trim() ? 1 : 0);
    const lotValide = nbLot > 0 && champsLot.filter((c) => c.required).every((c) => !!lotForm[c.key]);

    async function lancerLot() {
        if (!champLibelle) return;
        const libelles = [...lotLibelles];
        if (lotSaisie.trim() && !libelles.some((l) => l.toLowerCase() === lotSaisie.trim().toLowerCase())) libelles.push(lotSaisie.trim());
        setLotSaisie('');
        setLotLibelles(libelles);
        const lignes: LigneLot[] = libelles.map((l) => ({ libelle: l, statut: 'attente' }));
        setLotLignes(lignes);
        setLotEnCours(true);
        let crees = 0;
        for (let i = 0; i < libelles.length; i++) {
            const libelle = libelles[i] ?? '';
            try {
                await api.create(payload({ ...lotForm, [champLibelle.key]: libelle }));
                lignes[i] = { libelle, statut: 'cree' };
                crees++;
            } catch (err) {
                const msg = err instanceof ApiError ? err.message : String(err);
                const doublon = (err instanceof ApiError && err.status === 409) || /existe d[ée]j[àa]/i.test(msg);
                lignes[i] = { libelle, statut: doublon ? 'ignore' : 'erreur', detail: doublon ? 'Existe déjà' : msg };
            }
            setLotLignes([...lignes]);
        }
        setLotEnCours(false);
        succes('Succès', `${crees} ${crees > 1 ? config.entitePluriel : config.entite} ${fem ? 'créée' : 'créé'}${crees > 1 ? 's' : ''}`);
        rafraichir();
    }

    // --- Rendu
    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>{config.titre}</h1>
                    <p className="muted">{config.sousTitre}</p>
                </div>
                <div className="cellule-actions">
                    {config.saisieParLot && <Button label="Ajout en lot" icon="pi pi-list" outlined onClick={ouvrirLot} />}
                    <Button label={`${nouveau} ${capitaliser(config.entite)}`} icon="pi pi-plus" onClick={ouvrirCreation} />
                </div>
            </div>

            <div className="stats-ligne">
                <StatCarte libelle={`Total ${config.entitePluriel}`} valeur={stats.total} />
                <StatCarte libelle={fem ? 'Actives' : 'Actifs'} valeur={stats.actifs} ton="succes" />
                <StatCarte libelle={fem ? 'Inactives' : 'Inactifs'} valeur={stats.inactifs} ton="alerte" />
            </div>

            <div className="barre-filtres">
                <input placeholder={`Rechercher ${fem ? 'une' : 'un'} ${config.entite}...`} value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                {(config.filtres ?? []).map((f, i) => (
                    <Dropdown key={f.rowKey} value={filtres[i]} options={optionsFiltre(i)} onChange={(e) => changerFiltre(i, e.value ?? null)} placeholder={f.placeholder} filter showClear className="filtre-dropdown" />
                ))}
                {filtresActifs && (
                    <Button
                        label="Effacer les filtres"
                        icon="pi pi-filter-slash"
                        text
                        onClick={() => {
                            setRecherche('');
                            setFiltres((config.filtres ?? []).map(() => null));
                        }}
                    />
                )}
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" onClick={rafraichir} />
            </div>

            {listeQuery.isError && <p className="error">Impossible de charger {fem ? 'les' : 'les'} {config.entitePluriel}.</p>}

            <DataTable
                value={liste}
                loading={listeQuery.isLoading}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                size="small"
                stripedRows
                emptyMessage={`${fem ? 'Aucune' : 'Aucun'} ${config.entite} ${fem ? 'trouvée' : 'trouvé'}`}
                rowClassName={(row: T) => (row.actif ? '' : 'ligne-inactive')}
                scrollable
            >
                {config.colonnes.map((col) => (
                    <Column
                        key={col.key}
                        header={col.header}
                        field={col.key}
                        sortable
                        body={(row: T) => {
                            const v = val(row, col.key);
                            if (v === null || v === undefined || v === '') return '-';
                            if (col.type === 'date') return formatDateFr(String(v));
                            if (col.type === 'badge') return <span className="code-badge">{String(v)}</span>;
                            const sous = col.subKey ? val(row, col.subKey) : undefined;
                            return (
                                <div className="cellule-trajet">
                                    <span>{String(v)}</span>
                                    {sous ? <span className="muted">{String(sous)}</span> : null}
                                </div>
                            );
                        }}
                    />
                ))}
                <Column header="Statut" field="actif" sortable body={(row: T) => <Tag value={row.actif ? 'Actif' : 'Inactif'} severity={row.actif ? 'success' : 'danger'} />} />
                <Column
                    header="Actions"
                    body={(row: T) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(row)} />
                            <Button
                                icon={row.actif ? 'pi pi-lock' : 'pi pi-lock-open'}
                                rounded
                                text
                                severity={row.actif ? 'warning' : 'success'}
                                tooltip={row.actif ? 'Désactiver' : 'Activer'}
                                disabled={basculer.isPending}
                                onClick={() => confirmerBascule(row)}
                            />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? `Modifier ${article} ${config.entite}` : `${nouveau} ${config.entite}`} visible={dialogOuvert} style={{ width: 'min(460px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <div className="form-grid">
                    {config.champs.map((c) => {
                        const err = touche[c.key] ? erreurChamp(c, form) : null;
                        return (
                            <label key={c.key} className="span-2">
                                {c.label}
                                {c.required ? ' *' : ''}
                                {c.type === 'dropdown' ? (
                                    <Dropdown
                                        value={form[c.key] || null}
                                        options={optionsChamp(c, form)}
                                        onChange={(e) => {
                                            changerChamp(c.key, e.value ?? '');
                                            setTouche((t) => ({ ...t, [c.key]: true }));
                                        }}
                                        placeholder={c.placeholder}
                                        filter
                                        showClear={!c.required}
                                    />
                                ) : (
                                    <input
                                        value={form[c.key] ?? ''}
                                        placeholder={c.placeholder}
                                        maxLength={c.maxLength}
                                        onChange={(e) => changerChamp(c.key, e.target.value)}
                                        onBlur={() => setTouche((t) => ({ ...t, [c.key]: true }))}
                                    />
                                )}
                                {err && <span className="texte-danger">{err}</span>}
                            </label>
                        );
                    })}
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" outlined severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button label={enEdition ? 'Modifier' : 'Créer'} icon="pi pi-check" loading={sauvegarder.isPending} disabled={!formValide || sauvegarder.isPending} onClick={() => sauvegarder.mutate()} />
                </div>
            </Dialog>

            {config.saisieParLot && (
                <Dialog header={`Ajout en lot — ${config.entitePluriel}`} visible={lotOuvert} style={{ width: 'min(600px, 95vw)' }} onHide={() => !lotEnCours && setLotOuvert(false)} closable={!lotEnCours} modal>
                    <div className="form-grid">
                        {champsLot.map((c) => (
                            <label key={c.key} className="span-2">
                                {c.label}
                                {c.required ? ' *' : ''}
                                <Dropdown
                                    value={lotForm[c.key] || null}
                                    options={optionsChamp(c, lotForm)}
                                    onChange={(e) =>
                                        setLotForm((prev) => {
                                            const next = { ...prev, [c.key]: e.value ?? '' };
                                            for (const x of config.champs) if (x.dependsOn?.champ === c.key) next[x.key] = '';
                                            return next;
                                        })
                                    }
                                    placeholder={c.placeholder}
                                    filter
                                    showClear={!c.required}
                                    disabled={lotEnCours || lotLignes.length > 0}
                                />
                            </label>
                        ))}
                        <label className="span-2">
                            Libellés *
                            <div className="tags-saisie">
                                {lotLibelles.map((l) => (
                                    <span key={l} className="tag-libelle">
                                        {l}
                                        {!lotEnCours && lotLignes.length === 0 && (
                                            <button type="button" className="tag-suppr" onClick={() => setLotLibelles((prev) => prev.filter((x) => x !== l))} aria-label={`Retirer ${l}`}>
                                                ×
                                            </button>
                                        )}
                                    </span>
                                ))}
                                <input
                                    value={lotSaisie}
                                    placeholder={lotLibelles.length ? '' : `Saisir un ${config.entite} puis Entrée`}
                                    disabled={lotEnCours || lotLignes.length > 0}
                                    onChange={(e) => setLotSaisie(e.target.value)}
                                    onKeyDown={lotKeyDown}
                                    onPaste={lotPaste}
                                />
                            </div>
                            <span className="muted">
                                Entrée pour valider chaque libellé — un collage multi-lignes crée un tag par ligne. {nbLot} libellé(s) à créer ; les doublons déjà en base seront ignorés.
                            </span>
                        </label>
                    </div>

                    {lotLignes.length > 0 && (
                        <ul className="lot-lignes">
                            {lotLignes.map((l) => (
                                <li key={l.libelle} className={`lot-${l.statut}`}>
                                    <i className={ICONES_LOT[l.statut]} /> {l.libelle}
                                    {l.detail && <span className="muted"> — {l.detail}</span>}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="dialog-actions">
                        <Button label="Fermer" outlined severity="secondary" disabled={lotEnCours} onClick={() => setLotOuvert(false)} />
                        {lotLignes.length === 0 && <Button label={`Créer ${nbLot} ${nbLot > 1 ? config.entitePluriel : config.entite}`} icon="pi pi-check" disabled={!lotValide} onClick={() => void lancerLot()} />}
                    </div>
                </Dialog>
            )}
        </section>
    );
}

function capitaliser(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
