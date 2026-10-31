import type { MouseEvent } from 'react';

const FONCTIONS = ['Réservation instantanée', 'Suivi GPS en temps réel', 'Paiement Mobile Money', 'Notifications et alertes'];

/**
 * Téléchargement de l'application mobile. Les deux badges sont des liens inertes :
 * l'application n'est pas encore publiée, on ne renvoie donc vers aucun magasin.
 * L'Angular dessinait deux maquettes de téléphone en ~400 lignes de HTML ; on
 * garde le propos (texte, fonctions, badges) sur deux colonnes sobres.
 */
export function Application() {
    const inerte = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault();

    return (
        <section className="acc-section acc-application" id="application" aria-labelledby="acc-application-titre">
            <div className="acc-application-texte">
                <span className="acc-surtitre acc-surtitre-clair">Téléchargez l’application SYNERGIA</span>
                <h2 id="acc-application-titre" className="acc-titre">
                    Trouvez un <mark>transport</mark> à proximité avec notre application
                </h2>
                <p>Notre application mobile vous permet de réserver vos billets, suivre vos bus en direct et gérer vos voyages à travers toute la Guinée.</p>
                <ul className="acc-application-fonctions">
                    {FONCTIONS.map((f) => (
                        <li key={f}>
                            <i className="pi pi-check-circle" aria-hidden="true" /> {f}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="acc-application-magasins">
                <a className="acc-magasin" href="#application" aria-disabled="true" onClick={inerte} title="Bientôt disponible">
                    <i className="pi pi-google" aria-hidden="true" />
                    <span>
                        <small>Disponible sur</small>
                        <strong>Google Play</strong>
                    </span>
                </a>
                <a className="acc-magasin" href="#application" aria-disabled="true" onClick={inerte} title="Bientôt disponible">
                    <i className="pi pi-apple" aria-hidden="true" />
                    <span>
                        <small>Télécharger sur</small>
                        <strong>App Store</strong>
                    </span>
                </a>
                <p className="acc-application-bientot">Bientôt disponible sur les deux magasins.</p>
            </div>
        </section>
    );
}
