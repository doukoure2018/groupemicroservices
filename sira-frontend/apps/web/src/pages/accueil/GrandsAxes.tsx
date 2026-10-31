import { useId, useState } from 'react';
import { CONSEILS_PRATIQUES, GRANDS_AXES } from '../../data/referentiel-voyage';

/**
 * Les trois grands axes longue distance du pays puis les conseils pratiques
 * avant de partir, en accordéon. Un seul conseil ouvert à la fois : la liste
 * reste courte à l'écran et le lecteur sait toujours où il en est.
 */
export function GrandsAxes() {
    const [conseilOuvert, setConseilOuvert] = useState<number>(0);
    const idBase = useId();

    return (
        <section className="acc-section" id="axes" aria-labelledby="acc-axes-titre">
            <header className="acc-entete">
                <span className="acc-surtitre acc-surtitre-or">Longue distance</span>
                <h2 id="acc-axes-titre" className="acc-titre">
                    Les grands axes du pays
                </h2>
            </header>

            <div className="acc-axes">
                {GRANDS_AXES.map((axe) => (
                    <article key={axe.titre} className="acc-axe">
                        <h3>{axe.titre}</h3>
                        <p className="muted acc-axe-itineraire">{axe.itineraire}</p>
                        <dl className="acc-axe-chiffres">
                            <div>
                                <dt>Distance</dt>
                                <dd>{axe.distance}</dd>
                            </div>
                            <div>
                                <dt>Durée</dt>
                                <dd>{axe.duree}</dd>
                            </div>
                            <div>
                                <dt>Tarif</dt>
                                <dd className="acc-tarif">{axe.tarif}</dd>
                            </div>
                        </dl>
                        <ul className="acc-axe-points">
                            {axe.points.map((pt) => (
                                <li key={pt}>
                                    <i className="pi pi-check" aria-hidden="true" />
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>

            <div className="acc-conseils" id="conseils">
                <h3 className="acc-sous-titre">Conseils pratiques avant de partir</h3>
                <ul className="acc-accordeon">
                    {CONSEILS_PRATIQUES.map((c, i) => {
                        const ouvert = conseilOuvert === i;
                        return (
                            <li key={c.titre} className={ouvert ? 'acc-conseil est-ouvert' : 'acc-conseil'}>
                                <h4>
                                    <button type="button" className="acc-conseil-bouton" aria-expanded={ouvert} aria-controls={`${idBase}-conseil-${i}`} onClick={() => setConseilOuvert(ouvert ? -1 : i)}>
                                        <i className={`pi ${c.icone} acc-conseil-icone`} aria-hidden="true" />
                                        <span className="acc-conseil-titre">{c.titre}</span>
                                        <i className="pi pi-chevron-down acc-conseil-chevron" aria-hidden="true" />
                                    </button>
                                </h4>
                                <p id={`${idBase}-conseil-${i}`} className="acc-conseil-texte" hidden={!ouvert}>
                                    {c.texte}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
