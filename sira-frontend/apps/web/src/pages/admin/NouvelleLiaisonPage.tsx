import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { DEVISES, formatMontant, TYPE_SITES, type Arrivee, type Depart, type Offre, type Site, type Trajet, type Ville } from '@sira/core';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { num, useNotif } from './shared';

/**
 * Assistant « Nouvelle liaison » : crée en un parcours sites → points → trajet → (offre).
 * Port du NouvelleLiaisonComponent Angular ; chaque étape d'exécution réutilise l'existant
 * (départ retrouvé par libellé = nom du site, arrivée par site) pour rester relançable après une erreur.
 */

const ETAPES = ['Départ', 'Arrivée', 'Trajet', 'Offre', 'Récapitulatif'] as const;
type ModeSite = 'existant' | 'nouveau';
const MODES = [
    { label: 'Site existant', value: 'existant' },
    { label: 'Créer un site', value: 'nouveau' }
];

interface ChoixSite {
    villeUuid: string;
    mode: ModeSite;
    siteUuid: string;
    nouveauNom: string;
    nouveauType: string;
    nouvelleAdresse: string;
}
const CHOIX_VIDE: ChoixSite = { villeUuid: '', mode: 'existant', siteUuid: '', nouveauNom: '', nouveauType: 'GARE_ROUTIERE', nouvelleAdresse: '' };

interface TrajetSaisie {
    libelleTrajet: string;
    dureeEstimeeMinutes: string;
    distanceKm: string;
    montantBase: string;
    montantBagages: string;
    devise: string;
}
const TRAJET_VIDE: TrajetSaisie = { libelleTrajet: '', dureeEstimeeMinutes: '', distanceKm: '', montantBase: '', montantBagages: '', devise: 'GNF' };

interface OffreSaisie {
    creer: boolean;
    vehiculeUuid: string;
    dateDepart: string;
    heureDepart: string;
    nombrePlacesTotal: string;
    montant: string;
}
const OFFRE_VIDE: OffreSaisie = { creer: false, vehiculeUuid: '', dateDepart: '', heureDepart: '', nombrePlacesTotal: '', montant: '' };

type StatutLigne = 'attente' | 'en_cours' | 'fait' | 'reutilise' | 'erreur' | 'ignore';
interface LigneExec {
    libelle: string;
    statut: StatutLigne;
    detail?: string;
}
const LIBELLE_STATUT: Record<StatutLigne, string> = { attente: 'En attente', en_cours: 'En cours…', fait: 'Créé', reutilise: 'Réutilisé', erreur: 'Erreur', ignore: 'Ignorée' };
const SEVERITE_STATUT: Record<StatutLigne, 'secondary' | 'info' | 'success' | 'warning' | 'danger'> = {
    attente: 'secondary',
    en_cours: 'info',
    fait: 'success',
    reutilise: 'warning',
    erreur: 'danger',
    ignore: 'secondary'
};

function aujourdHuiIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function heureCourante(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function egal(a: string | undefined, b: string | undefined): boolean {
    return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();
}

/** Bloc de sélection d'un site (départ ou arrivée) : ville → site existant ou nouveau site. */
function ChoixSiteBloc({
    titre,
    choix,
    onChange,
    villes,
    sites,
    chargementSites,
    erreurInline
}: {
    titre: string;
    choix: ChoixSite;
    onChange: (c: ChoixSite) => void;
    villes: Ville[];
    sites: Site[];
    chargementSites: boolean;
    erreurInline?: string | null;
}) {
    const villesOptions = useMemo(() => villes.map((v) => ({ label: `${v.libelle} (${v.regionLibelle})`, value: v.villeUuid })), [villes]);
    const sitesOptions = useMemo(() => sites.map((s) => ({ label: `${s.nom} · ${TYPE_SITES.find((t) => t.value === s.typeSite)?.label ?? s.typeSite ?? ''}`, value: s.siteUuid })), [sites]);
    return (
        <>
            <h2>{titre}</h2>
            <div className="form-grid">
                <label className="span-2">
                    Ville *
                    <Dropdown value={choix.villeUuid || null} options={villesOptions} onChange={(e) => onChange({ ...choix, villeUuid: e.value ?? '', siteUuid: '' })} placeholder="Choisir une ville" filter />
                </label>
                {choix.villeUuid && (
                    <>
                        <div className="span-2">
                            <SelectButton value={choix.mode} options={MODES} onChange={(e) => e.value && onChange({ ...choix, mode: e.value as ModeSite })} allowEmpty={false} />
                        </div>
                        {choix.mode === 'existant' ? (
                            <label className="span-2">
                                Site *
                                <Dropdown
                                    value={choix.siteUuid || null}
                                    options={sitesOptions}
                                    onChange={(e) => onChange({ ...choix, siteUuid: e.value ?? '' })}
                                    placeholder={chargementSites ? 'Chargement…' : 'Choisir un site'}
                                    filter
                                    loading={chargementSites}
                                    emptyMessage="Aucun site dans cette ville — créez-en un ci-dessus."
                                />
                                {!chargementSites && sites.length === 0 && <span className="muted">Aucun site dans cette ville — créez-en un ci-dessus.</span>}
                            </label>
                        ) : (
                            <>
                                <label>
                                    Nom du site *
                                    <input value={choix.nouveauNom} placeholder="ex. Gare routière de Kankan" onChange={(e) => onChange({ ...choix, nouveauNom: e.target.value })} />
                                </label>
                                <label>
                                    Type de site
                                    <Dropdown value={choix.nouveauType} options={TYPE_SITES.map((t) => ({ label: t.label, value: t.value }))} onChange={(e) => onChange({ ...choix, nouveauType: e.value })} />
                                </label>
                                <label className="span-2">
                                    Adresse *
                                    <input value={choix.nouvelleAdresse} placeholder="ex. Quartier Madina, face au marché" onChange={(e) => onChange({ ...choix, nouvelleAdresse: e.target.value })} />
                                    <span className="muted">L'adresse crée automatiquement la localisation du site.</span>
                                </label>
                            </>
                        )}
                    </>
                )}
                {erreurInline && <p className="error span-2">{erreurInline}</p>}
            </div>
        </>
    );
}

function choixValide(c: ChoixSite): boolean {
    if (!c.villeUuid) return false;
    if (c.mode === 'existant') return !!c.siteUuid;
    return c.nouveauNom.trim().length >= 2 && c.nouvelleAdresse.trim().length >= 5;
}

export function NouvelleLiaisonPage() {
    const { toast, succes, erreur } = useNotif();
    const [etape, setEtape] = useState(0);
    const [depart, setDepart] = useState<ChoixSite>(CHOIX_VIDE);
    const [arrivee, setArrivee] = useState<ChoixSite>(CHOIX_VIDE);
    const [trajet, setTrajet] = useState<TrajetSaisie>(TRAJET_VIDE);
    const [offre, setOffre] = useState<OffreSaisie>(OFFRE_VIDE);
    const [trajetExistant, setTrajetExistant] = useState<Trajet | null>(null);
    const [verifTrajet, setVerifTrajet] = useState(false);
    const [execution, setExecution] = useState<LigneExec[]>([]);
    const [enCours, setEnCours] = useState(false);
    const [resultat, setResultat] = useState<{ trajet: Trajet; offre?: Offre } | null>(null);

    const villesQuery = useQuery({ queryKey: ['villes-actives'], queryFn: async () => (await api.geo.villesActives()).data.villes ?? [] });
    const vehiculesQuery = useQuery({ queryKey: ['mes-vehicules'], queryFn: async () => (await api.vehicules.mesVehicules()).data.vehicules ?? [] });
    const sitesDepartQuery = useQuery({
        queryKey: ['sites-ville', depart.villeUuid],
        queryFn: async () => (await api.transport.sitesByVille(depart.villeUuid)).data.sites ?? [],
        enabled: !!depart.villeUuid
    });
    const sitesArriveeQuery = useQuery({
        queryKey: ['sites-ville', arrivee.villeUuid],
        queryFn: async () => (await api.transport.sitesByVille(arrivee.villeUuid)).data.sites ?? [],
        enabled: !!arrivee.villeUuid
    });

    // Ville sans site → bascule automatique sur « Créer un site ».
    useEffect(() => {
        if (sitesDepartQuery.isSuccess && sitesDepartQuery.data.length === 0 && depart.mode === 'existant') setDepart((d) => ({ ...d, mode: 'nouveau' }));
    }, [sitesDepartQuery.isSuccess, sitesDepartQuery.data, depart.mode]);
    useEffect(() => {
        if (sitesArriveeQuery.isSuccess && sitesArriveeQuery.data.length === 0 && arrivee.mode === 'existant') setArrivee((a) => ({ ...a, mode: 'nouveau' }));
    }, [sitesArriveeQuery.isSuccess, sitesArriveeQuery.data, arrivee.mode]);

    const villes = villesQuery.data ?? [];
    const villeDepart = villes.find((v) => v.villeUuid === depart.villeUuid);
    const villeArrivee = villes.find((v) => v.villeUuid === arrivee.villeUuid);
    const siteDepartChoisi = (sitesDepartQuery.data ?? []).find((s) => s.siteUuid === depart.siteUuid);
    const siteArriveeChoisi = (sitesArriveeQuery.data ?? []).find((s) => s.siteUuid === arrivee.siteUuid);
    const nomSiteDepart = depart.mode === 'existant' ? siteDepartChoisi?.nom : depart.nouveauNom;
    const nomSiteArrivee = arrivee.mode === 'existant' ? siteArriveeChoisi?.nom : arrivee.nouveauNom;
    const memeSite = depart.mode === 'existant' && arrivee.mode === 'existant' && !!depart.siteUuid && depart.siteUuid === arrivee.siteUuid;

    const vehiculeChoisi = (vehiculesQuery.data ?? []).find((v) => v.vehiculeUuid === offre.vehiculeUuid);
    const vehiculesOptions = useMemo(
        () => (vehiculesQuery.data ?? []).map((v) => ({ label: `${v.immatriculation} — ${v.marque ?? ''} ${v.modele ?? ''} (${v.nombrePlaces ?? '?'} places)`, value: v.vehiculeUuid })),
        [vehiculesQuery.data]
    );

    function dateDepartValide(): boolean {
        if (!offre.dateDepart || !offre.heureDepart) return false;
        const auj = aujourdHuiIso();
        if (offre.dateDepart > auj) return true;
        if (offre.dateDepart < auj) return false;
        return offre.heureDepart > heureCourante();
    }

    const etapeValide = [
        choixValide(depart),
        choixValide(arrivee) && !memeSite,
        !verifTrajet && (!!trajetExistant || (trajet.libelleTrajet.trim().length > 0 && (num(trajet.dureeEstimeeMinutes) ?? 0) > 0 && (num(trajet.montantBase) ?? 0) > 0)),
        !offre.creer || (!!offre.vehiculeUuid && dateDepartValide() && (num(offre.nombrePlacesTotal) ?? 0) > 0 && (num(offre.montant) ?? 0) > 0),
        true
    ];

    /** Pré-contrôle best-effort : un trajet existe-t-il déjà entre ces deux sites existants ? */
    async function verifierTrajetExistant() {
        setTrajetExistant(null);
        if (depart.mode !== 'existant' || arrivee.mode !== 'existant' || !siteDepartChoisi || !siteArriveeChoisi) return;
        setVerifTrajet(true);
        try {
            const departs = (await api.transport.departsActifsBySite(siteDepartChoisi.siteUuid!)).data.departs ?? [];
            const pointDepart = departs.find((d) => egal(d.libelle, siteDepartChoisi.nom));
            if (!pointDepart) return;
            const trajets = (await api.transport.trajetsByDepart(pointDepart.departUuid!)).data.trajets ?? [];
            const existant = trajets.find((t) => t.arriveeSiteUuid === siteArriveeChoisi.siteUuid);
            if (existant) {
                setTrajetExistant(existant);
                setTrajet({
                    libelleTrajet: existant.libelleTrajet ?? '',
                    dureeEstimeeMinutes: String(existant.dureeEstimeeMinutes ?? ''),
                    distanceKm: String(existant.distanceKm ?? ''),
                    montantBase: String(existant.montantBase ?? ''),
                    montantBagages: String(existant.montantBagages ?? ''),
                    devise: existant.devise ?? 'GNF'
                });
            }
        } catch {
            // le backend signalera le doublon à l'exécution
        } finally {
            setVerifTrajet(false);
        }
    }

    function suivant() {
        if (etape === 1) {
            if (!trajet.libelleTrajet.trim()) setTrajet((t) => ({ ...t, libelleTrajet: `${villeDepart?.libelle ?? ''} → ${villeArrivee?.libelle ?? ''}` }));
            void verifierTrajetExistant();
        }
        setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
    }

    function choisirVehicule(uuid: string) {
        const v = (vehiculesQuery.data ?? []).find((x) => x.vehiculeUuid === uuid);
        setOffre((o) => ({
            ...o,
            vehiculeUuid: uuid,
            nombrePlacesTotal: o.nombrePlacesTotal || String(v?.nombrePlaces ?? ''),
            montant: o.montant || trajet.montantBase
        }));
    }

    // --- Exécution
    const termine = !!resultat;

    function majLigne(lignes: LigneExec[], i: number, patch: Partial<LigneExec>) {
        lignes[i] = { ...(lignes[i] as LigneExec), ...patch };
        setExecution([...lignes]);
    }

    async function resoudreSite(choix: ChoixSite, sitesConnus: Site[]): Promise<{ site: Site; cree: boolean }> {
        if (choix.mode === 'existant') {
            const s = sitesConnus.find((x) => x.siteUuid === choix.siteUuid);
            if (!s) throw new Error('Site introuvable, rechargez la page');
            return { site: s, cree: false };
        }
        const loc = (await api.geo.createLocalisation({ quartierUuid: null, adresseComplete: choix.nouvelleAdresse.trim(), description: "Créée via l'assistant Nouvelle liaison" })).data.localisation;
        if (!loc?.localisationUuid) throw new Error('La création de la localisation a échoué');
        const site = (
            await api.transport.createSite({ localisationUuid: loc.localisationUuid, villeUuid: choix.villeUuid, nom: choix.nouveauNom.trim(), typeSite: choix.nouveauType, actif: true })
        ).data.site;
        if (!site) throw new Error('La création du site a échoué');
        return { site, cree: true };
    }

    const creerLiaison = useMutation({
        mutationFn: async () => {
            const lignes: LigneExec[] = [
                { libelle: depart.mode === 'nouveau' ? `Créer le site de départ « ${depart.nouveauNom} »` : `Site de départ « ${nomSiteDepart} »`, statut: 'attente' },
                { libelle: arrivee.mode === 'nouveau' ? `Créer le site d'arrivée « ${arrivee.nouveauNom} »` : `Site d'arrivée « ${nomSiteArrivee} »`, statut: 'attente' },
                { libelle: 'Point de départ', statut: 'attente' },
                { libelle: "Point d'arrivée", statut: 'attente' },
                { libelle: trajetExistant ? `Trajet « ${trajet.libelleTrajet} » (existant)` : `Trajet « ${trajet.libelleTrajet} »`, statut: 'attente' },
                { libelle: offre.creer ? `Offre du ${offre.dateDepart} à ${offre.heureDepart}` : 'Offre (non demandée)', statut: offre.creer ? 'attente' : 'ignore' }
            ];
            setExecution([...lignes]);
            setEnCours(true);
            let courante = 0;
            try {
                // 1. Site de départ
                majLigne(lignes, 0, { statut: 'en_cours' });
                const sd = await resoudreSite(depart, sitesDepartQuery.data ?? []);
                majLigne(lignes, 0, { statut: sd.cree ? 'fait' : 'reutilise', detail: villeDepart?.libelle });

                // 2. Site d'arrivée
                courante = 1;
                majLigne(lignes, 1, { statut: 'en_cours' });
                const sa = await resoudreSite(arrivee, sitesArriveeQuery.data ?? []);
                if (sd.site.siteUuid === sa.site.siteUuid) throw new Error("Le site d'arrivée doit être différent du site de départ");
                majLigne(lignes, 1, { statut: sa.cree ? 'fait' : 'reutilise', detail: villeArrivee?.libelle });

                // 3. Point de départ (réutilisé si un départ porte le nom du site)
                courante = 2;
                majLigne(lignes, 2, { statut: 'en_cours' });
                const departs = (await api.transport.departsActifsBySite(sd.site.siteUuid!)).data.departs ?? [];
                let pointDepart: Depart | undefined = departs.find((d) => egal(d.libelle, sd.site.nom));
                if (!pointDepart) {
                    pointDepart = (await api.transport.createDepart({ siteUuid: sd.site.siteUuid!, libelle: sd.site.nom, actif: true })).data.depart;
                    if (!pointDepart) throw new Error('La création du point de départ a échoué');
                    majLigne(lignes, 2, { statut: 'fait', detail: pointDepart.libelle });
                } else {
                    majLigne(lignes, 2, { statut: 'reutilise', detail: pointDepart.libelle });
                }

                // 4. Point d'arrivée (réutilisé si une arrivée vise déjà ce site)
                courante = 3;
                majLigne(lignes, 3, { statut: 'en_cours' });
                const arrivees = (await api.transport.arriveesByDepart(pointDepart.departUuid!)).data.arrivees ?? [];
                let pointArrivee: Arrivee | undefined = arrivees.find((a) => a.siteUuid === sa.site.siteUuid);
                if (!pointArrivee) {
                    pointArrivee = (
                        await api.transport.createArrivee({ siteUuid: sa.site.siteUuid!, departUuid: pointDepart.departUuid!, libelle: sa.site.nom, libelleDepart: pointDepart.libelle, actif: true })
                    ).data.arrivee;
                    if (!pointArrivee) throw new Error("La création du point d'arrivée a échoué");
                    majLigne(lignes, 3, { statut: 'fait', detail: pointArrivee.libelle });
                } else {
                    majLigne(lignes, 3, { statut: 'reutilise', detail: pointArrivee.libelle });
                }

                // 5. Trajet
                courante = 4;
                majLigne(lignes, 4, { statut: 'en_cours' });
                let trajetFinal: Trajet;
                if (trajetExistant) {
                    trajetFinal = trajetExistant;
                    majLigne(lignes, 4, { statut: 'reutilise' });
                } else {
                    const t = (
                        await api.transport.createTrajet({
                            departUuid: pointDepart.departUuid!,
                            arriveeUuid: pointArrivee.arriveeUuid!,
                            libelleTrajet: trajet.libelleTrajet.trim(),
                            dureeEstimeeMinutes: num(trajet.dureeEstimeeMinutes),
                            distanceKm: num(trajet.distanceKm),
                            montantBase: num(trajet.montantBase),
                            montantBagages: num(trajet.montantBagages),
                            devise: trajet.devise,
                            actif: true
                        })
                    ).data.trajet;
                    if (!t) throw new Error('La création du trajet a échoué');
                    trajetFinal = t;
                    majLigne(lignes, 4, { statut: 'fait' });
                }

                // 6. Offre (optionnelle)
                let offreCreee: Offre | undefined;
                if (offre.creer) {
                    courante = 5;
                    majLigne(lignes, 5, { statut: 'en_cours' });
                    offreCreee = (
                        await api.offres.create({
                            trajetUuid: trajetFinal.trajetUuid!,
                            vehiculeUuid: offre.vehiculeUuid,
                            dateDepart: offre.dateDepart,
                            heureDepart: offre.heureDepart,
                            nombrePlacesTotal: num(offre.nombrePlacesTotal) ?? 0,
                            montant: num(offre.montant) ?? 0,
                            devise: trajetFinal.devise
                        })
                    ).data.offre;
                    majLigne(lignes, 5, { statut: 'fait', detail: offreCreee?.statut });
                }
                return { trajet: trajetFinal, offre: offreCreee };
            } catch (err) {
                const msg = err instanceof ApiError || err instanceof Error ? err.message : 'Erreur inattendue';
                majLigne(lignes, courante, { statut: 'erreur', detail: msg });
                throw err;
            } finally {
                setEnCours(false);
            }
        },
        onSuccess: (res) => {
            setResultat(res);
            succes('Liaison créée', `${res.trajet.libelleTrajet ?? 'Le trajet'} est prête`);
        },
        onError: (err) => erreur(err, 'La création de la liaison a échoué.')
    });

    function recommencer() {
        setEtape(0);
        setDepart(CHOIX_VIDE);
        setArrivee(CHOIX_VIDE);
        setTrajet(TRAJET_VIDE);
        setOffre(OFFRE_VIDE);
        setTrajetExistant(null);
        setExecution([]);
        setResultat(null);
    }

    const lectureSeule = !!trajetExistant;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Assistant Nouvelle liaison</h1>
                    <p className="muted">Créez un trajet complet (sites, points, tarif, offre) en un seul parcours</p>
                </div>
            </div>

            <ol className="stepper">
                {ETAPES.map((label, i) => (
                    <li key={label} className={i === etape ? 'active' : i < etape ? 'fait' : ''}>
                        <button type="button" disabled={i >= etape || enCours || termine} onClick={() => setEtape(i)}>
                            <span className="stepper-num">{i + 1}</span>
                            {label}
                        </button>
                    </li>
                ))}
            </ol>

            {etape === 0 && (
                <ChoixSiteBloc titre="D'où part la liaison ?" choix={depart} onChange={setDepart} villes={villes} sites={sitesDepartQuery.data ?? []} chargementSites={sitesDepartQuery.isFetching} />
            )}

            {etape === 1 && (
                <ChoixSiteBloc
                    titre="Où arrive la liaison ?"
                    choix={arrivee}
                    onChange={setArrivee}
                    villes={villes}
                    sites={sitesArriveeQuery.data ?? []}
                    chargementSites={sitesArriveeQuery.isFetching}
                    erreurInline={memeSite ? "Le site d'arrivée doit être différent du site de départ." : null}
                />
            )}

            {etape === 2 && (
                <>
                    <h2>Caractéristiques du trajet</h2>
                    <p className="rappel-liaison">
                        <Tag value={villeDepart?.libelle ?? '?'} severity="info" /> → <Tag value={villeArrivee?.libelle ?? '?'} severity="success" />
                        <span className="muted">
                            {' '}
                            {nomSiteDepart} → {nomSiteArrivee}
                        </span>
                    </p>
                    {verifTrajet && <p className="muted">Vérification des trajets existants…</p>}
                    {trajetExistant && (
                        <div className="bandeau-alerte">
                            <strong>Un trajet existe déjà pour cette combinaison départ/arrivée.</strong>
                            <br />« {trajetExistant.libelleTrajet} » sera réutilisé tel quel — ses caractéristiques ci-dessous sont en lecture seule. Pour les modifier, passez par l'écran Trajets.
                        </div>
                    )}
                    <div className="form-grid">
                        <label className="span-2">
                            Libellé du trajet *
                            <input value={trajet.libelleTrajet} disabled={lectureSeule} onChange={(e) => setTrajet({ ...trajet, libelleTrajet: e.target.value })} />
                        </label>
                        <label>
                            Durée estimée (minutes) *
                            <input type="number" min={1} value={trajet.dureeEstimeeMinutes} disabled={lectureSeule} onChange={(e) => setTrajet({ ...trajet, dureeEstimeeMinutes: e.target.value })} />
                        </label>
                        <label>
                            Distance (km)
                            <input type="number" min={0} step={0.1} value={trajet.distanceKm} disabled={lectureSeule} onChange={(e) => setTrajet({ ...trajet, distanceKm: e.target.value })} />
                        </label>
                        <label>
                            Montant de base *
                            <input type="number" min={1} step={1000} value={trajet.montantBase} disabled={lectureSeule} onChange={(e) => setTrajet({ ...trajet, montantBase: e.target.value })} />
                        </label>
                        <label>
                            Montant bagages
                            <input type="number" min={0} step={1000} value={trajet.montantBagages} disabled={lectureSeule} onChange={(e) => setTrajet({ ...trajet, montantBagages: e.target.value })} />
                        </label>
                        <label>
                            Devise
                            <Dropdown value={trajet.devise} options={DEVISES.map((d) => ({ label: d.label, value: d.value }))} disabled={lectureSeule} onChange={(e) => setTrajet({ ...trajet, devise: e.value })} />
                        </label>
                    </div>
                </>
            )}

            {etape === 3 && (
                <>
                    <h2>Première offre (optionnel)</h2>
                    <label className="ligne">
                        <Checkbox checked={offre.creer} onChange={(e) => setOffre({ ...offre, creer: !!e.checked })} />
                        Publier immédiatement une première offre sur ce trajet
                    </label>
                    {!offre.creer && <p className="muted">Vous pourrez créer des offres plus tard depuis l'écran « Offres de transport ».</p>}
                    {offre.creer && vehiculesQuery.isSuccess && vehiculesQuery.data.length === 0 && (
                        <p className="error">
                            Aucun véhicule ne vous appartient — une offre exige un véhicule dont vous êtes propriétaire. Créez d'abord votre véhicule dans l'écran Véhicules, ou décochez cette option.
                        </p>
                    )}
                    {offre.creer && (
                        <div className="form-grid">
                            <label className="span-2">
                                Véhicule *
                                <Dropdown value={offre.vehiculeUuid || null} options={vehiculesOptions} onChange={(e) => choisirVehicule(e.value ?? '')} placeholder="Choisir un véhicule" filter loading={vehiculesQuery.isLoading} />
                            </label>
                            <label>
                                Date de départ *
                                <input type="date" min={aujourdHuiIso()} value={offre.dateDepart} onChange={(e) => setOffre({ ...offre, dateDepart: e.target.value })} />
                            </label>
                            <label>
                                Heure de départ *
                                <input type="time" value={offre.heureDepart} onChange={(e) => setOffre({ ...offre, heureDepart: e.target.value })} />
                            </label>
                            {offre.dateDepart && offre.heureDepart && !dateDepartValide() && <p className="error span-2">La date et l'heure de départ doivent être postérieures à maintenant.</p>}
                            <label>
                                Nombre de places *
                                <input type="number" min={1} value={offre.nombrePlacesTotal} onChange={(e) => setOffre({ ...offre, nombrePlacesTotal: e.target.value })} />
                            </label>
                            <label>
                                Montant par place *
                                <input type="number" min={1} step={1000} value={offre.montant} onChange={(e) => setOffre({ ...offre, montant: e.target.value })} />
                            </label>
                        </div>
                    )}
                </>
            )}

            {etape === 4 && (
                <>
                    <h2>Récapitulatif</h2>
                    {execution.length === 0 ? (
                        <dl className="recap">
                            <dt>Départ</dt>
                            <dd>
                                {villeDepart?.libelle} · {nomSiteDepart} {depart.mode === 'nouveau' && <Tag value="à créer" severity="warning" />}
                            </dd>
                            <dt>Arrivée</dt>
                            <dd>
                                {villeArrivee?.libelle} · {nomSiteArrivee} {arrivee.mode === 'nouveau' && <Tag value="à créer" severity="warning" />}
                            </dd>
                            <dt>Trajet</dt>
                            <dd>
                                {trajet.libelleTrajet} — {trajet.dureeEstimeeMinutes} min — {formatMontant(num(trajet.montantBase), trajet.devise)}
                                {trajetExistant && <Tag value="existant, réutilisé" severity="info" />}
                            </dd>
                            <dt>Offre</dt>
                            <dd>
                                {offre.creer
                                    ? `${vehiculeChoisi?.immatriculation ?? ''} — ${offre.dateDepart} ${offre.heureDepart} — ${offre.nombrePlacesTotal} places à ${formatMontant(num(offre.montant), trajet.devise)}`
                                    : "Aucune offre pour l'instant"}
                            </dd>
                        </dl>
                    ) : (
                        <ul className="plan-execution">
                            {execution.map((l, i) => (
                                <li key={i} className={`exec-${l.statut}`}>
                                    <Tag value={LIBELLE_STATUT[l.statut]} severity={SEVERITE_STATUT[l.statut]} />
                                    <span>{l.libelle}</span>
                                    {l.detail && <span className="muted">— {l.detail}</span>}
                                </li>
                            ))}
                        </ul>
                    )}

                    {creerLiaison.isError && !termine && (
                        <p className="muted">Les éléments déjà créés sont conservés (référentiels réutilisables) : corrigez puis relancez, l'assistant les retrouvera.</p>
                    )}

                    {resultat && (
                        <div className="bandeau-succes">
                            <strong>Liaison créée avec succès !</strong>
                            <br />
                            Le trajet « {resultat.trajet.libelleTrajet} » est actif.
                            {resultat.offre && (
                                <>
                                    <br />
                                    Une offre a été publiée (statut {resultat.offre.statut}).
                                </>
                            )}
                            <div className="cellule-actions" style={{ marginTop: 12 }}>
                                <Link to="/admin/trajets" className="p-button p-button-outlined p-button-sm">
                                    Voir les trajets
                                </Link>
                                <Link to="/admin/offres" className="p-button p-button-outlined p-button-sm">
                                    Voir les offres
                                </Link>
                                <Button label="Créer une autre liaison" icon="pi pi-plus" size="small" onClick={recommencer} />
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="dialog-actions">
                <Button label="Précédent" icon="pi pi-arrow-left" text severity="secondary" disabled={etape === 0 || enCours || termine} onClick={() => setEtape((e) => e - 1)} />
                {etape < ETAPES.length - 1 ? (
                    <Button label="Suivant" icon="pi pi-arrow-right" iconPos="right" disabled={!etapeValide[etape]} onClick={suivant} />
                ) : (
                    !termine && <Button label="Créer la liaison" icon="pi pi-bolt" severity="success" loading={enCours} disabled={enCours} onClick={() => creerLiaison.mutate()} />
                )}
            </div>
        </section>
    );
}
