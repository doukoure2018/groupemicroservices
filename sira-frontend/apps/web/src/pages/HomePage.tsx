import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDateFr, formatHeure, formatMontant, getMontantEffectif, getPourcentageReduction, hasPromotion, type Offre } from '@sira/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export function HomePage() {
    const [villeDepartUuid, setVilleDepartUuid] = useState('');
    const [villeArriveeUuid, setVilleArriveeUuid] = useState('');
    const [dateDepart, setDateDepart] = useState('');

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
            ).data.offres
    });

    const villes = villesQuery.data ?? [];

    return (
        <section className="card">
            <h1>Réserver un voyage</h1>

            {villesQuery.isLoading && <p className="muted">Chargement des villes…</p>}
            {villesQuery.isError && <p className="error">Impossible de charger les villes. Le gateway (:9000) et billetterieservice sont-ils démarrés ?</p>}

            <form
                className="search-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    recherche.mutate();
                }}
            >
                <label>
                    Ville de départ
                    <select value={villeDepartUuid} onChange={(e) => setVilleDepartUuid(e.target.value)}>
                        <option value="">Toutes</option>
                        {villes.map((v) => (
                            <option key={v.villeUuid} value={v.villeUuid}>
                                {v.libelle}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Ville d'arrivée
                    <select value={villeArriveeUuid} onChange={(e) => setVilleArriveeUuid(e.target.value)}>
                        <option value="">Toutes</option>
                        {villes.map((v) => (
                            <option key={v.villeUuid} value={v.villeUuid}>
                                {v.libelle}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Date de départ
                    <input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} />
                </label>
                <button type="submit" disabled={recherche.isPending}>
                    {recherche.isPending ? 'Recherche…' : 'Rechercher'}
                </button>
            </form>

            {recherche.isError && <p className="error">La recherche a échoué. Réessayez.</p>}
            {recherche.data && <Resultats offres={recherche.data} />}
        </section>
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
