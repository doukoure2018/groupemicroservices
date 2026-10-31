interface Valeur {
    icone: string;
    titre: string;
    texte: string;
}

const VALEURS: Valeur[] = [
    { icone: 'pi-shield', titre: 'Sécurité', texte: 'La sécurité de nos passagers est notre priorité absolue.' },
    { icone: 'pi-heart', titre: 'Service client', texte: 'Un accompagnement personnalisé à chaque étape du voyage.' },
    { icone: 'pi-bolt', titre: 'Innovation', texte: 'Des solutions technologiques modernes pour simplifier vos voyages.' }
];

/**
 * Présentation de l'entreprise. L'Angular affichait une photo d'intérieur de bus
 * et des compteurs animés (voyageurs, note moyenne...) : sans photo dans le projet
 * React et sans chiffres vérifiés, on garde un panneau de marque et les valeurs.
 */
export function APropos() {
    return (
        <section className="acc-section" id="about" aria-labelledby="acc-apropos-titre">
            <div className="acc-apropos">
                <div className="acc-apropos-panneau" aria-hidden="true">
                    <img src="/brand/synergia-emblem-512x512.png" alt="" width={96} height={96} />
                    <strong>SYNERGIA</strong>
                    <span>Immobilier et transport en Guinée</span>
                </div>

                <div className="acc-apropos-texte">
                    <span className="acc-surtitre acc-surtitre-or">
                        <i className="pi pi-users" aria-hidden="true" /> À propos de nous
                    </span>
                    <h2 id="acc-apropos-titre" className="acc-titre">
                        Connecter la Guinée, un trajet à la fois
                    </h2>
                    <p className="acc-sous">SYNERGIA est née de la volonté de moderniser le transport terrestre en Guinée. Notre mission est de rendre le voyage accessible, sûr et agréable pour tous les Guinéens.</p>

                    <ul className="acc-valeurs">
                        {VALEURS.map((v) => (
                            <li key={v.titre} className="acc-valeur">
                                <span className="acc-icone-carree est-or" aria-hidden="true">
                                    <i className={`pi ${v.icone}`} />
                                </span>
                                <div>
                                    <h3>{v.titre}</h3>
                                    <p className="muted">{v.texte}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
