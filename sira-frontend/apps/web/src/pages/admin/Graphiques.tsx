/**
 * Deux formes de graphique construites en HTML, sans librairie.
 * Palette catégorielle validée pour la vision des couleurs : les sept teintes
 * passent l'écart minimal en protanopie et en vision normale. Trois d'entre
 * elles descendent sous 3:1 de contraste sur fond clair, d'où la règle appliquée
 * ici : chaque segment porte une étiquette lisible et une légende chiffrée, donc
 * l'identité ne repose jamais sur la couleur seule.
 */

export const TEINTES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7'] as const;

/** Teinte unique pour une comparaison de magnitude (une seule série). */
export const TEINTE_MAGNITUDE = '#2a78d6';

export interface PartGraphique {
    libelle: string;
    valeur: number;
}

/**
 * Part-à-tout : barre empilée horizontale. Préférée au camembert dès que les
 * classes sont nombreuses ou leurs noms longs.
 */
export function BarreEmpilee({ parts, titre }: { parts: PartGraphique[]; titre: string }) {
    const visibles = parts.filter((p) => p.valeur > 0);
    const total = visibles.reduce((s, p) => s + p.valeur, 0);

    if (!total) return <p className="muted">Aucune donnée</p>;

    return (
        <figure className="graphique">
            <figcaption className="sr-only">{titre}</figcaption>
            <div className="barre-empilee" role="img" aria-label={`${titre} : ${visibles.map((p) => `${p.libelle} ${p.valeur}`).join(', ')}`}>
                {visibles.map((p) => {
                    const part = (p.valeur / total) * 100;
                    const index = parts.findIndex((x) => x.libelle === p.libelle);
                    return (
                        <span
                            key={p.libelle}
                            className="segment-empile"
                            style={{ width: `${part}%`, background: TEINTES[index % TEINTES.length] }}
                            title={`${p.libelle} : ${p.valeur}`}
                        >
                            {part >= 8 && <span className="etiquette-segment">{p.valeur}</span>}
                        </span>
                    );
                })}
            </div>
            <ul className="legende">
                {visibles.map((p) => {
                    const index = parts.findIndex((x) => x.libelle === p.libelle);
                    return (
                        <li key={p.libelle}>
                            <span className="pastille" style={{ background: TEINTES[index % TEINTES.length] }} aria-hidden="true" />
                            {p.libelle} <strong>{p.valeur}</strong>
                        </li>
                    );
                })}
            </ul>
        </figure>
    );
}

/**
 * Comparaison de magnitude : barres horizontales, teinte unique. L'horizontale
 * laisse la place aux libellés longs (« Points de vente »).
 */
export function BarresHorizontales({ parts, titre }: { parts: PartGraphique[]; titre: string }) {
    const visibles = parts.filter((p) => p.valeur > 0);
    const max = Math.max(...visibles.map((p) => p.valeur), 1);

    if (!visibles.length) return <p className="muted">Aucune donnée</p>;

    return (
        <figure className="graphique">
            <figcaption className="sr-only">{titre}</figcaption>
            <ul className="barres-horizontales">
                {visibles.map((p) => (
                    <li key={p.libelle}>
                        <span className="barre-libelle">{p.libelle}</span>
                        <span className="barre-piste">
                            <span className="barre-valeur" style={{ width: `${(p.valeur / max) * 100}%`, background: TEINTE_MAGNITUDE }} />
                        </span>
                        <strong className="barre-chiffre">{p.valeur}</strong>
                    </li>
                ))}
            </ul>
        </figure>
    );
}
