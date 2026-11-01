/** Un nombre que l'on règle au clic : − valeur +, borné, avec une aide sous le libellé. */
export function Compteur({
    libelle,
    aide,
    valeur,
    min,
    max,
    onChange
}: {
    libelle: string;
    aide?: string;
    valeur: number;
    min: number;
    max: number;
    onChange: (valeur: number) => void;
}) {
    return (
        <div className="compteur">
            <div className="compteur-texte">
                <span className="compteur-libelle">{libelle}</span>
                {aide && <span className="muted">{aide}</span>}
            </div>
            <div className="compteur-commandes">
                <button type="button" className="compteur-rond" aria-label={`Retirer ${libelle.toLowerCase()}`} disabled={valeur <= min} onClick={() => onChange(valeur - 1)}>
                    −
                </button>
                <span className="compteur-valeur" aria-live="polite">
                    {valeur}
                </span>
                <button type="button" className="compteur-rond" aria-label={`Ajouter ${libelle.toLowerCase()}`} disabled={valeur >= max} onClick={() => onChange(valeur + 1)}>
                    +
                </button>
            </div>
        </div>
    );
}
