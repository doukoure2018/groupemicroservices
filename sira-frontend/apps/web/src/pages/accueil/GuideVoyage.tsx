import { useId, useState, type ReactNode } from 'react';
import { AXES_INTERVILLES, PREFECTURES, REGIONS_NATURELLES, type RegionNaturelle } from '../../data/referentiel-voyage';

interface Props {
    /** Carte interactive affichée à côté du tableau ; passée par la page qui tient l'état de la recherche. */
    carte: ReactNode;
}

/**
 * Guide du voyageur : les 33 préfectures classées par région naturelle (distance,
 * durée et tarif indicatif depuis Conakry) puis les liaisons entre villes de
 * l'intérieur. Contenu statique issu du référentiel, aucun appel réseau.
 */
export function GuideVoyage({ carte }: Props) {
    const [regionActive, setRegionActive] = useState<RegionNaturelle>('Basse Guinée');
    const idPanneau = useId();
    const prefectures = PREFECTURES.filter((p) => p.region === regionActive);

    return (
        <section className="acc-section" id="guide" aria-labelledby="acc-guide-titre">
            <header className="acc-entete">
                <span className="acc-surtitre">
                    <i className="pi pi-book" aria-hidden="true" /> Guide du voyageur
                </span>
                <h2 id="acc-guide-titre" className="acc-titre">
                    Distances et tarifs depuis Conakry
                </h2>
                <p className="acc-sous">
                    Les 33 préfectures de Guinée : distance routière, durée estimée en taxi-brousse et tarif indicatif. Les prix réels sont ceux des offres publiées par les transporteurs : utilisez la recherche ci-dessus.
                </p>
            </header>

            <div className="acc-guide-grille">
                <div className="acc-carte-cadre">
                    <div className="acc-carte-entete">
                        <span className="acc-icone-ronde" aria-hidden="true">
                            <i className="pi pi-map-marker" />
                        </span>
                        <div>
                            <strong>République de Guinée</strong>
                            <span className="muted">Cliquez sur une ville pour remplir le départ, puis une seconde pour l’arrivée.</span>
                        </div>
                    </div>
                    {carte}
                </div>

                <div className="acc-guide-tableau">
                    <div className="acc-onglets" role="tablist" aria-label="Régions naturelles">
                        {REGIONS_NATURELLES.map((r, i) => (
                            <button
                                key={r}
                                type="button"
                                role="tab"
                                id={`${idPanneau}-onglet-${i}`}
                                aria-selected={regionActive === r}
                                aria-controls={`${idPanneau}-panneau`}
                                className={regionActive === r ? 'acc-onglet est-actif' : 'acc-onglet'}
                                onClick={() => setRegionActive(r)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <div id={`${idPanneau}-panneau`} role="tabpanel" aria-labelledby={`${idPanneau}-onglet-${REGIONS_NATURELLES.indexOf(regionActive)}`} className="acc-tableau-defilant">
                        <table className="acc-tableau">
                            <caption className="sr-only">Préfectures de {regionActive} : distance, durée et tarif indicatif depuis Conakry</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Préfecture</th>
                                    <th scope="col">Distance</th>
                                    <th scope="col">Durée estimée</th>
                                    <th scope="col">Tarif indicatif (GNF)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prefectures.map((p) => (
                                    <tr key={p.nom}>
                                        <th scope="row">
                                            {p.nom}
                                            {p.note && <small className="acc-tableau-note">{p.note}</small>}
                                        </th>
                                        <td>{p.distance}</td>
                                        <td>{p.duree}</td>
                                        <td className="acc-tarif">{p.tarif}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="muted acc-note">Données indicatives (taxi-brousse, hors saison des pluies). Les distances varient de 20 à 50 km selon l’axe emprunté.</p>
                </div>
            </div>

            <h3 className="acc-sous-titre">Liaisons entre villes de l’intérieur</h3>
            <ul className="acc-liaisons">
                {AXES_INTERVILLES.map((a) => (
                    <li key={`${a.de}-${a.vers}`} className="acc-liaison">
                        <span className="acc-liaison-villes">
                            {a.de} <span className="acc-fleche" aria-hidden="true">→</span>
                            <span className="sr-only"> vers </span>
                            {a.vers}
                        </span>
                        <span className="muted">
                            {a.distance} · {a.duree}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
