interface Etape {
    icone: string;
    titre: string;
    texte: string;
}

const ETAPES: Etape[] = [
    { icone: 'pi-search', titre: 'Recherchez', texte: 'Choisissez votre trajet, votre date et le nombre de passagers.' },
    { icone: 'pi-chart-bar', titre: 'Comparez', texte: 'Consultez les offres, horaires et prix disponibles.' },
    { icone: 'pi-credit-card', titre: 'Payez', texte: 'Mobile money ou carte bancaire, en toute sécurité.' },
    { icone: 'pi-ticket', titre: 'Voyagez', texte: 'Recevez votre billet électronique et partez sereinement.' }
];

export function CommentCaMarche() {
    return (
        <section className="acc-section" id="how-it-works" aria-labelledby="acc-etapes-titre">
            <header className="acc-entete">
                <span className="acc-surtitre acc-surtitre-or">Comment ça marche</span>
                <h2 id="acc-etapes-titre" className="acc-titre">
                    Réservez en 4 étapes simples
                </h2>
            </header>

            <ol className="acc-etapes">
                {ETAPES.map((e, i) => (
                    <li key={e.titre} className="acc-etape">
                        <span className="acc-etape-icone" aria-hidden="true">
                            <i className={`pi ${e.icone}`} />
                        </span>
                        <span className="acc-etape-numero">Étape {i + 1}</span>
                        <h3>{e.titre}</h3>
                        <p className="muted">{e.texte}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}
