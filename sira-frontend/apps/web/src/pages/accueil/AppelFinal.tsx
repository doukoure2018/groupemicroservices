interface Props {
    /** Ramène le visiteur au formulaire de recherche en haut de page. */
    onReserver: () => void;
}

/** Numéro repris de la page Angular ; à remplacer par la ligne réelle du service client. */
const TELEPHONE = '+224620000000';

export function AppelFinal({ onReserver }: Props) {
    return (
        <section className="acc-section acc-appel" aria-labelledby="acc-appel-titre">
            <h2 id="acc-appel-titre" className="acc-titre">
                Prêt à voyager à travers la Guinée ?
            </h2>
            <p>Rejoignez des milliers de voyageurs qui font confiance à SYNERGIA pour leurs déplacements quotidiens.</p>
            <div className="acc-appel-actions">
                <button type="button" className="acc-appel-principal" onClick={onReserver}>
                    Réserver un billet <i className="pi pi-arrow-up" aria-hidden="true" />
                </button>
                <a className="acc-appel-secondaire" href={`tel:${TELEPHONE}`}>
                    <i className="pi pi-phone" aria-hidden="true" /> Nous appeler
                </a>
            </div>
        </section>
    );
}
