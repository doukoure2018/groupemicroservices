interface Service {
    icone: string;
    titre: string;
    texte: string;
}

/** Textes repris de la page Angular (accents rétablis). */
const SERVICES: Service[] = [
    { icone: 'pi-shield', titre: 'Sécurité garantie', texte: 'Véhicules contrôlés, chauffeurs certifiés et assurance voyage incluse pour tous les passagers.' },
    { icone: 'pi-clock', titre: 'Ponctualité assurée', texte: 'Départs à l’heure avec un suivi GPS en temps réel de tous nos véhicules sur chaque trajet.' },
    { icone: 'pi-wallet', titre: 'Prix compétitifs', texte: 'Les meilleurs tarifs du marché avec des offres spéciales et des réductions pour les voyageurs fréquents.' },
    { icone: 'pi-headphones', titre: 'Support 24/7', texte: 'Une équipe dédiée disponible jour et nuit pour vous accompagner avant, pendant et après votre voyage.' },
    { icone: 'pi-map', titre: 'Large couverture', texte: 'Plus de 50 destinations à travers toute la Guinée avec des connexions vers toutes les régions.' },
    { icone: 'pi-mobile', titre: 'Réservation facile', texte: 'Réservez en quelques clics depuis votre téléphone avec confirmation instantanée par SMS.' }
];

export function Services() {
    return (
        <section className="acc-section" id="services" aria-labelledby="acc-services-titre">
            <header className="acc-entete">
                <span className="acc-surtitre acc-surtitre-or">
                    <i className="pi pi-sparkles" aria-hidden="true" /> Nos services
                </span>
                <h2 id="acc-services-titre" className="acc-titre">
                    Pourquoi choisir SYNERGIA ?
                </h2>
                <p className="acc-sous">Une expérience de voyage unique avec des services pensés pour votre confort et votre sécurité.</p>
            </header>

            <div className="acc-grille-3">
                {SERVICES.map((s, i) => (
                    <article key={s.titre} className="acc-service">
                        {/* Alternance vert / or : une seule famille de teintes, contrairement à l'arc-en-ciel Angular. */}
                        <span className={i % 2 === 0 ? 'acc-icone-carree' : 'acc-icone-carree est-or'} aria-hidden="true">
                            <i className={`pi ${s.icone}`} />
                        </span>
                        <h3>{s.titre}</h3>
                        <p className="muted">{s.texte}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
