import { ApiError } from '@sira/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    ajouterJours,
    arriveeOffre,
    aujourdhuiIso,
    BAGAGES_MAX,
    dureeOffreMinutes,
    estComplete,
    etiquettesOffres,
    FILTRES_DEFAUT,
    filtrerOffres,
    formatDateFr,
    formatDuree,
    formatHeure,
    formatMontant,
    getMontantEffectif,
    getPourcentageReduction,
    hasPromotion,
    libelleJourCourt,
    libelleVoyageurs,
    PLACES_MAX,
    PLAGES_HORAIRES,
    trierOffres,
    TRIS_OFFRES,
    typesVehiculePresents,
    typeVehiculeOffre,
    VOYAGEURS_DEFAUT,
    type FiltresOffres,
    type Offre,
    type TriOffres,
    type Ville,
    type Voyageurs
} from '@sira/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Compteur } from '../components/Compteur';
import './accueil/accueil.css';
import { APropos } from './accueil/APropos';
import { AppelFinal } from './accueil/AppelFinal';
import { Application } from './accueil/Application';
import { CarteGuinee } from './accueil/CarteGuinee';
import { CommentCaMarche } from './accueil/CommentCaMarche';
import { GrandsAxes } from './accueil/GrandsAxes';
import { GuideVoyage } from './accueil/GuideVoyage';
import { Services } from './accueil/Services';

interface RegionAccueil {
    regionUuid: string;
    libelle: string;
    villes: Ville[];
}

/**
 * Photos de régions servies depuis `public/regions/`. Carte explicite plutôt que
 * chemin déduit du libellé : une image absente laisserait un fond blanc avec du
 * texte blanc. Pour en ajouter une, déposer le fichier et compléter cette table.
 */
const PHOTOS_REGION: Record<string, string> = {
    kankan: '/regions/kankan.jpg'
};

/** Libellé de région vers une clé de fichier : minuscules, sans accents ni espaces. */
function cleRegion(libelle: string): string {
    return libelle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function HomePage() {
    const [villeDepartUuid, setVilleDepartUuid] = useState('');
    const [villeArriveeUuid, setVilleArriveeUuid] = useState('');
    const [dateDepart, setDateDepart] = useState('');
    const [voyageurs, setVoyageurs] = useState<Voyageurs>(VOYAGEURS_DEFAUT);
    const [voyageursOuvert, setVoyageursOuvert] = useState(false);
    /** Jour effectivement affiché : la date cherchée, puis celle du bandeau. */
    const [jourAffiche, setJourAffiche] = useState<string | null>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const resultatsRef = useRef<HTMLDivElement>(null);

    const villesQuery = useQuery({
        queryKey: ['villes-actives'],
        queryFn: async () => (await api.geo.villesActives()).data.villes
    });

    const recherche = useMutation({
        mutationFn: async (jour?: string) =>
            (
                await api.offres.recherche({
                    villeDepartUuid: villeDepartUuid || undefined,
                    villeArriveeUuid: villeArriveeUuid || undefined,
                    dateDepart: jour ?? dateDepart ?? undefined
                })
            ).data.offres,
        onSuccess: () => setTimeout(() => resultatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    });

    /** Changer de jour depuis le bandeau des résultats, sans repasser par le formulaire. */
    function chercherLeJour(jour: string) {
        setJourAffiche(jour);
        setDateDepart(jour);
        recherche.mutate(jour);
    }

    const villes = villesQuery.data ?? [];

    /**
     * Régions de Guinée dérivées des villes actives (endpoint public), triées par
     * nombre de villes. Les régions de test (préfixe « ZZ ») sont exclues de la
     * vitrine — les villes de test restent sélectionnables dans la recherche.
     */
    const regions = useMemo<RegionAccueil[]>(() => {
        const estTest = (libelle: string) => /^zz[\s-]/i.test(libelle.trim());
        const map = new Map<string, RegionAccueil>();
        for (const v of villes) {
            const cle = v.regionUuid || v.regionLibelle;
            if (!cle || !v.regionLibelle || estTest(v.regionLibelle)) continue;
            if (!map.has(cle)) map.set(cle, { regionUuid: cle, libelle: v.regionLibelle, villes: [] });
            map.get(cle)!.villes.push(v);
        }
        return [...map.values()].sort((a, b) => b.villes.length - a.villes.length);
    }, [villes]);

    // Contrat backend (/offres/recherche) : les deux villes sont obligatoires, la date est facultative.
    const [erreurSaisie, setErreurSaisie] = useState<string | null>(null);
    const memeVille = !!villeDepartUuid && villeDepartUuid === villeArriveeUuid;
    const formulaireValide = !!villeDepartUuid && !!villeArriveeUuid && !memeVille;

    function soumettre(e: React.FormEvent) {
        e.preventDefault();
        if (!villeDepartUuid || !villeArriveeUuid) {
            setErreurSaisie('Choisissez une ville de départ et une ville d’arrivée.');
            return;
        }
        if (memeVille) {
            setErreurSaisie('La ville d’arrivée doit être différente de la ville de départ.');
            return;
        }
        setErreurSaisie(null);
        setJourAffiche(dateDepart || null);
        recherche.mutate(dateDepart || undefined);
    }

    function inverser() {
        setVilleDepartUuid(villeArriveeUuid);
        setVilleArriveeUuid(villeDepartUuid);
    }

    function allerAuFormulaire() {
        heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function choisirRegion(r: RegionAccueil) {
        if (r.villes[0]) setVilleDepartUuid(r.villes[0].villeUuid);
        allerAuFormulaire();
    }

    /**
     * Clic sur une ville de la carte : on complète ce qui manque au formulaire,
     * le départ d'abord puis l'arrivée, et on y ramène le visiteur dès que le
     * trajet est complet. Si les deux villes sont déjà choisies, le clic repart
     * d'un nouveau départ. Choisir deux fois la même ville ne fait rien.
     */
    function choisirVilleCarte(ville: Ville) {
        if (!villeDepartUuid) {
            setVilleDepartUuid(ville.villeUuid);
            if (ville.villeUuid === villeArriveeUuid) setVilleArriveeUuid('');
            else if (villeArriveeUuid) allerAuFormulaire();
            return;
        }
        if (!villeArriveeUuid) {
            if (ville.villeUuid === villeDepartUuid) return;
            setVilleArriveeUuid(ville.villeUuid);
            allerAuFormulaire();
            return;
        }
        setVilleDepartUuid(ville.villeUuid);
        setVilleArriveeUuid('');
    }

    // Les liens du pied de page visent des ancres de cette page (/#guide, /#about...).
    // react-router ne fait pas défiler jusqu'au fragment : on s'en charge une fois
    // les sections rendues, elles sont statiques donc présentes dès le premier rendu.
    const location = useLocation();
    useEffect(() => {
        if (!location.hash) return;
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [location.hash, location.key]);

    return (
        <div className="accueil">
            <section className="hero-v2" ref={heroRef}>
                <div className="hero-v2-fond" aria-hidden="true" />
                <div className="hero-v2-contenu">
                    <span className="hero-tag">SYNERGIA · IMMO · TRANS · GUINÉE</span>
                    <h1>Commencez votre voyage</h1>
                    <p>Les meilleurs départs à travers la Guinée, réservés en quelques minutes.</p>
                </div>

                <form className="hero-barre" onSubmit={soumettre}>
                    <label className="hero-barre-champ">
                        <i className="pi pi-map-marker" aria-hidden="true" />
                        <span className="hero-barre-inner">
                            <span className="hero-barre-libelle">Ville de départ *</span>
                            <select value={villeDepartUuid} onChange={(e) => setVilleDepartUuid(e.target.value)} required disabled={villesQuery.isLoading}>
                                <option value="">{villesQuery.isLoading ? 'Chargement…' : 'D’où partez-vous ?'}</option>
                                {villes.map((v) => (
                                    <option key={v.villeUuid} value={v.villeUuid}>
                                        {v.libelle}
                                    </option>
                                ))}
                            </select>
                        </span>
                    </label>

                    <button type="button" className="hero-barre-inverser" onClick={inverser} title="Inverser départ et arrivée" aria-label="Inverser départ et arrivée">
                        <i className="pi pi-arrow-right-arrow-left" aria-hidden="true" />
                    </button>

                    <label className="hero-barre-champ">
                        <i className="pi pi-flag" aria-hidden="true" />
                        <span className="hero-barre-inner">
                            <span className="hero-barre-libelle">Ville d'arrivée *</span>
                            <select value={villeArriveeUuid} onChange={(e) => setVilleArriveeUuid(e.target.value)} required disabled={villesQuery.isLoading}>
                                <option value="">{villesQuery.isLoading ? 'Chargement…' : 'Où allez-vous ?'}</option>
                                {villes.map((v) => (
                                    <option key={v.villeUuid} value={v.villeUuid}>
                                        {v.libelle}
                                    </option>
                                ))}
                            </select>
                        </span>
                    </label>

                    <label className="hero-barre-champ">
                        <i className="pi pi-calendar" aria-hidden="true" />
                        <span className="hero-barre-inner">
                            <span className="hero-barre-libelle">Date de départ</span>
                            <input type="date" min={aujourdhuiIso()} value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} />
                        </span>
                    </label>

                    <div className="hero-barre-champ hero-barre-bouton">
                        <i className="pi pi-users" aria-hidden="true" />
                        <button type="button" aria-expanded={voyageursOuvert} onClick={() => setVoyageursOuvert((o) => !o)}>
                            <span className="hero-barre-libelle">Passagers / Bagages</span>
                            <span className="hero-barre-valeur">{libelleVoyageurs(voyageurs)}</span>
                        </button>
                        {voyageursOuvert && (
                            <div className="hero-popover">
                                <Compteur
                                    libelle="Adultes"
                                    aide="15 ans et plus"
                                    valeur={voyageurs.adultes}
                                    min={1}
                                    max={PLACES_MAX - voyageurs.enfants}
                                    onChange={(adultes) => setVoyageurs((v) => ({ ...v, adultes }))}
                                />
                                <Compteur
                                    libelle="Enfants"
                                    aide="Moins de 15 ans, accompagnés d'un adulte"
                                    valeur={voyageurs.enfants}
                                    min={0}
                                    max={PLACES_MAX - voyageurs.adultes}
                                    onChange={(enfants) => setVoyageurs((v) => ({ ...v, enfants }))}
                                />
                                <Compteur
                                    libelle="Bagages"
                                    aide="En soute, en plus du sac que chacun garde avec lui"
                                    valeur={voyageurs.bagages}
                                    min={0}
                                    max={BAGAGES_MAX}
                                    onChange={(bagages) => setVoyageurs((v) => ({ ...v, bagages }))}
                                />
                                <p className="muted petit">Jusqu'à {PLACES_MAX} places par réservation.</p>
                                <button type="button" className="secondary" onClick={() => setVoyageursOuvert(false)}>
                                    Terminé
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="hero-barre-rechercher" disabled={recherche.isPending || !formulaireValide}>
                        <i className="pi pi-search" aria-hidden="true" /> {recherche.isPending ? 'Recherche…' : 'Rechercher'}
                    </button>
                </form>
                {(erreurSaisie || memeVille) && <p className="error hero-barre-erreur">{erreurSaisie ?? 'La ville d’arrivée doit être différente de la ville de départ.'}</p>}
            </section>

            <div ref={resultatsRef}>
                {recherche.isError && <p className="error">{recherche.error instanceof ApiError ? recherche.error.message : 'La recherche a échoué. Réessayez.'}</p>}
                {recherche.data && (
                    <section className="accueil-resultats">
                        <Resultats offres={recherche.data} voyageurs={voyageurs} jour={jourAffiche} onChangerJour={chercherLeJour} enCours={recherche.isPending} />
                    </section>
                )}
            </div>

            <section className="promos">
                <article className="promo promo-vert">
                    <div className="promo-texte">
                        <strong>Réservez en ligne</strong>
                        <span>Comparez les départs et réservez votre place en quelques minutes.</span>
                    </div>
                    <i className="pi pi-ticket promo-icone" aria-hidden="true" />
                </article>
                <article className="promo promo-or">
                    <div className="promo-texte">
                        <strong>Billet QR sans papier</strong>
                        <span>Recevez votre billet avec QR code et présentez-le à l'embarquement.</span>
                    </div>
                    <i className="pi pi-qrcode promo-icone" aria-hidden="true" />
                </article>
            </section>

            {regions.length > 0 && (
                <section className="top-destinations">
                    <h2>Top destinations</h2>
                    <p className="muted center-texte">Les régions de Guinée desservies par SYNERGIA</p>
                    <div className="destinations-grille">
                        {regions.map((r, i) => {
                            const photo = PHOTOS_REGION[cleRegion(r.libelle)];
                            return (
                            <button
                                key={r.regionUuid}
                                type="button"
                                className={photo ? `destination-carte destination-photo` : `destination-carte destination-${i % 5}`}
                                // Dégradé sombre par-dessus la photo : sans lui le libellé blanc devient illisible.
                                style={photo ? { backgroundImage: `linear-gradient(180deg, rgba(10, 30, 20, 0.15) 0%, rgba(10, 30, 20, 0.78) 100%), url(${photo})` } : undefined}
                                onClick={() => choisirRegion(r)}
                            >
                                <span className="destination-nom">{r.libelle}</span>
                                <span className="destination-meta">
                                    {r.villes.length} ville{r.villes.length > 1 ? 's' : ''} desservie{r.villes.length > 1 ? 's' : ''}
                                </span>
                            </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Contenu éditorial statique : aucun appel réseau, la carte se nourrit des villes déjà chargées. */}
            <GuideVoyage carte={<CarteGuinee villes={villes} chargement={villesQuery.isLoading} villeDepartUuid={villeDepartUuid} villeArriveeUuid={villeArriveeUuid} onChoisirVille={choisirVilleCarte} />} />
            <GrandsAxes />
            <Services />
            <CommentCaMarche />
            <APropos />
            <Application />
            <AppelFinal onReserver={allerAuFormulaire} />
        </div>
    );
}

const PLACES_RARES = 5;
const JOURS_BANDEAU = 14;

/**
 * Les départs trouvés : bandeau des jours suivants, tri et filtres sur le
 * client, puis une carte par voyage — heures, durée, arrivée du lendemain,
 * gares, véhicule, prix par personne et étiquettes qui le distinguent.
 */
function Resultats({
    offres,
    voyageurs,
    jour,
    onChangerJour,
    enCours
}: {
    offres: Offre[];
    voyageurs: Voyageurs;
    jour: string | null;
    onChangerJour: (jour: string) => void;
    enCours: boolean;
}) {
    const navigate = useNavigate();
    const [filtres, setFiltres] = useState<FiltresOffres>(FILTRES_DEFAUT);
    const [detail, setDetail] = useState<string | null>(null);

    const visibles = useMemo(() => trierOffres(filtrerOffres(offres, filtres), filtres.tri), [offres, filtres]);
    const etiquettes = useMemo(() => etiquettesOffres(offres), [offres]);
    const types = useMemo(() => typesVehiculePresents(offres), [offres]);
    const jours = useMemo(() => {
        if (!jour) return [];
        const debut = jour < aujourdhuiIso() ? jour : aujourdhuiIso();
        const liste = Array.from({ length: JOURS_BANDEAU }, (_, i) => ajouterJours(debut, i));
        return liste.includes(jour) ? liste : [jour, ...liste].sort();
    }, [jour]);

    function basculer(cle: 'plagesDepart' | 'typesVehicule', code: string) {
        setFiltres((f) => ({ ...f, [cle]: f[cle].includes(code) ? f[cle].filter((c) => c !== code) : [...f[cle], code] }));
    }

    function reserver(offre: Offre) {
        const params = new URLSearchParams({ adultes: String(voyageurs.adultes), enfants: String(voyageurs.enfants), bagages: String(voyageurs.bagages) });
        navigate(`/reserver/${offre.offreUuid}?${params}`);
    }

    return (
        <>
            <h2>{offres.length > 0 ? `${offres.length} voyage${offres.length > 1 ? 's' : ''} trouvé${offres.length > 1 ? 's' : ''}` : 'Résultats de la recherche'}</h2>

            {jours.length > 0 && (
                <div className="bandeau-dates" role="tablist" aria-label="Autres jours">
                    {jours.map((j) => (
                        <button key={j} type="button" role="tab" aria-selected={j === jour} className={j === jour ? 'actif' : ''} disabled={enCours} onClick={() => onChangerJour(j)}>
                            {libelleJourCourt(j)}
                        </button>
                    ))}
                </div>
            )}

            {offres.length > 1 && (
                <div className="filtres-barre">
                    <label>
                        Trier selon
                        <select value={filtres.tri} onChange={(e) => setFiltres((f) => ({ ...f, tri: e.target.value as TriOffres }))}>
                            {TRIS_OFFRES.map((t) => (
                                <option key={t.code} value={t.code}>
                                    {t.libelle}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="puces" role="group" aria-label="Heure de départ">
                        {PLAGES_HORAIRES.map((p) => (
                            <button
                                key={p.code}
                                type="button"
                                className={`puce ${filtres.plagesDepart.includes(p.code) ? 'actif' : ''}`}
                                aria-pressed={filtres.plagesDepart.includes(p.code)}
                                onClick={() => basculer('plagesDepart', p.code)}
                            >
                                {p.libelle}
                            </button>
                        ))}
                    </div>
                    {types.length > 1 && (
                        <div className="puces" role="group" aria-label="Type de véhicule">
                            {types.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`puce ${filtres.typesVehicule.includes(t) ? 'actif' : ''}`}
                                    aria-pressed={filtres.typesVehicule.includes(t)}
                                    onClick={() => basculer('typesVehicule', t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {offres.length === 0 && <p className="muted">Aucun voyage ne correspond à votre recherche. Essayez une autre date ou d'autres villes.</p>}
            {offres.length > 0 && visibles.length === 0 && (
                <p className="muted">
                    Vos filtres ne laissent passer aucun départ.{' '}
                    <button type="button" className="link-btn" onClick={() => setFiltres(FILTRES_DEFAUT)}>
                        Tout effacer
                    </button>
                </p>
            )}

            <ul className="resultats">
                {visibles.map((offre) => {
                    const arrivee = arriveeOffre(offre);
                    const duree = dureeOffreMinutes(offre);
                    const complet = estComplete(offre);
                    const places = offre.nombrePlacesDisponibles ?? 0;
                    const marques = etiquettes.get(offre.offreUuid ?? '') ?? [];
                    const ouvert = detail === offre.offreUuid;
                    return (
                        <li key={offre.offreUuid} className={`offre ${complet ? 'offre-complete' : ''}`}>
                            <div className="offre-trajet">
                                <div className="offre-horaires">
                                    <div>
                                        <span className="offre-heure">{formatHeure(offre.heureDepart)}</span>
                                        <span className="offre-gare">{offre.siteDepart ?? offre.villeDepartLibelle}</span>
                                    </div>
                                    <div className="offre-duree">{duree ? formatDuree(duree) : ''}</div>
                                    <div>
                                        <span className="offre-heure">
                                            {arrivee?.heure ?? '—'}
                                            {arrivee?.lendemain && <span className="offre-lendemain">+1 jour</span>}
                                        </span>
                                        <span className="offre-gare">{offre.siteArrivee ?? offre.villeArriveeLibelle}</span>
                                    </div>
                                </div>
                                <strong>
                                    {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                                </strong>
                            </div>

                            <div className="offre-vehicule">
                                <span className="pastille">{typeVehiculeOffre(offre)}</span>
                                {!complet && places <= PLACES_RARES && (
                                    <span className="offre-places-rares">
                                        {places} place{places > 1 ? 's' : ''} restante{places > 1 ? 's' : ''}
                                    </span>
                                )}
                                {marques.length > 0 && <span className="offre-etiquettes">{marques.join(' · ')}</span>}
                            </div>

                            <div className="offre-prix">
                                {complet ? (
                                    <span className="complet">Complet</span>
                                ) : (
                                    <>
                                        {hasPromotion(offre) && (
                                            <>
                                                <span className="prix-barre">{formatMontant(offre.montant, offre.devise)}</span>
                                                <span className="promo">-{getPourcentageReduction(offre)}%</span>
                                            </>
                                        )}
                                        <strong>{formatMontant(getMontantEffectif(offre), offre.devise)}</strong>
                                        <span className="par-personne">par personne</span>
                                    </>
                                )}
                            </div>

                            <div className="offre-action">
                                <button disabled={complet} onClick={() => reserver(offre)}>
                                    Réserver
                                </button>
                                <button type="button" className="link-btn" aria-expanded={ouvert} onClick={() => setDetail(ouvert ? null : (offre.offreUuid ?? null))}>
                                    {ouvert ? 'Masquer le détail' : 'Voir le détail'}
                                </button>
                            </div>

                            <div className="offre-date">
                                {formatDateFr(offre.dateDepart)} à {formatHeure(offre.heureDepart)}
                            </div>

                            {ouvert && (
                                <div className="offre-detail">
                                    <span>
                                        Durée <strong>{duree ? formatDuree(duree) : 'non précisée'}</strong> · Direct
                                    </span>
                                    <span>
                                        Véhicule <strong>{[typeVehiculeOffre(offre), offre.vehiculeMarque, offre.vehiculeModele].filter(Boolean).join(' ')}</strong>
                                        {offre.vehiculeClimatise ? ' · climatisé' : ''}
                                    </span>
                                    {offre.userFullName && (
                                        <span>
                                            Exploité par <strong>{offre.userFullName}</strong>
                                        </span>
                                    )}
                                    {offre.pointRendezvous && (
                                        <span>
                                            Rendez-vous <strong>{offre.pointRendezvous}</strong>
                                        </span>
                                    )}
                                    <span>
                                        Annulation{' '}
                                        <strong>{offre.annulationAutorisee === false ? 'non remboursable' : `jusqu'à ${offre.delaiAnnulationHeures ?? 24} h avant le départ`}</strong>
                                    </span>
                                    {offre.conditions && <span>{offre.conditions}</span>}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
