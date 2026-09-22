import { ApiError } from '@sira/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDateFr, formatHeure, formatMontant, getMontantEffectif, getPourcentageReduction, hasPromotion, type Offre, type Ville } from '@sira/core';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

interface RegionAccueil {
    regionUuid: string;
    libelle: string;
    villes: Ville[];
}

export function HomePage() {
    const [villeDepartUuid, setVilleDepartUuid] = useState('');
    const [villeArriveeUuid, setVilleArriveeUuid] = useState('');
    const [dateDepart, setDateDepart] = useState('');
    const heroRef = useRef<HTMLDivElement>(null);
    const resultatsRef = useRef<HTMLDivElement>(null);

    const villesQuery = useQuery({
        queryKey: ['villes-actives'],
        queryFn: async () => (await api.geo.villesActives()).data.villes
    });

    const recherche = useMutation({
        mutationFn: async () =>
            (
                await api.offres.recherche({
                    villeDepartUuid: villeDepartUuid || undefined,
                    villeArriveeUuid: villeArriveeUuid || undefined,
                    dateDepart: dateDepart || undefined
                })
            ).data.offres,
        onSuccess: () => setTimeout(() => resultatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    });

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
        recherche.mutate();
    }

    function inverser() {
        setVilleDepartUuid(villeArriveeUuid);
        setVilleArriveeUuid(villeDepartUuid);
    }

    function choisirRegion(r: RegionAccueil) {
        if (r.villes[0]) setVilleDepartUuid(r.villes[0].villeUuid);
        heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

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
                            <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} />
                        </span>
                    </label>

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
                        <h2>{recherche.data.length > 0 ? `${recherche.data.length} voyage${recherche.data.length > 1 ? 's' : ''} trouvé${recherche.data.length > 1 ? 's' : ''}` : 'Résultats de la recherche'}</h2>
                        <Resultats offres={recherche.data} />
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
                        {regions.map((r, i) => (
                            <button key={r.regionUuid} type="button" className={`destination-carte destination-${i % 5}`} onClick={() => choisirRegion(r)}>
                                <span className="destination-nom">{r.libelle}</span>
                                <span className="destination-meta">
                                    {r.villes.length} ville{r.villes.length > 1 ? 's' : ''} desservie{r.villes.length > 1 ? 's' : ''}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <section className="accueil-atouts">
                <Atout icone="pi-search" titre="Recherchez" texte="Trouvez les départs entre deux villes, à la date de votre choix." />
                <Atout icone="pi-ticket" titre="Réservez" texte="Choisissez vos places et votre mode de paiement en quelques clics." />
                <Atout icone="pi-qrcode" titre="Voyagez" texte="Présentez votre billet QR à l'embarquement, sans papier." />
            </section>
        </div>
    );
}

function Atout({ icone, titre, texte }: { icone: string; titre: string; texte: string }) {
    return (
        <article className="atout">
            <span className="atout-icone" aria-hidden="true">
                <i className={`pi ${icone}`} />
            </span>
            <strong>{titre}</strong>
            <span className="muted">{texte}</span>
        </article>
    );
}

function Resultats({ offres }: { offres: Offre[] }) {
    const navigate = useNavigate();

    if (offres.length === 0) {
        return <p className="muted">Aucun voyage ne correspond à votre recherche. Essayez une autre date ou d'autres villes.</p>;
    }
    return (
        <ul className="resultats">
            {offres.map((offre) => (
                <li key={offre.offreUuid} className="offre">
                    <div className="offre-trajet">
                        <strong>
                            {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                        </strong>
                        <span className="muted">
                            {offre.siteDepart} → {offre.siteArrivee}
                        </span>
                    </div>
                    <div className="offre-date">
                        {formatDateFr(offre.dateDepart)} à {formatHeure(offre.heureDepart)}
                    </div>
                    <div className="offre-prix">
                        {hasPromotion(offre) ? (
                            <>
                                <span className="prix-barre">{formatMontant(offre.montant, offre.devise)}</span>
                                <strong>{formatMontant(getMontantEffectif(offre), offre.devise)}</strong>
                                <span className="promo">-{getPourcentageReduction(offre)}%</span>
                            </>
                        ) : (
                            <strong>{formatMontant(offre.montant, offre.devise)}</strong>
                        )}
                        <span className="muted">{offre.nombrePlacesDisponibles} places disponibles</span>
                    </div>
                    <div className="offre-action">
                        <button onClick={() => navigate(`/reserver/${offre.offreUuid}`)}>Réserver</button>
                    </div>
                </li>
            ))}
        </ul>
    );
}
