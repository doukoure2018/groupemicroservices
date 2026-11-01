import { estSiege, type PlanSieges } from '@sira/core';

/**
 * Le véhicule vu de dessus, dessiné depuis le plan du serveur : chauffeur en
 * haut à gauche, numéros de rangée dans l'allée, un bouton par siège.
 */
export function PlanSiegesVue({
    plan,
    occupes,
    choisis,
    onBasculer
}: {
    plan: PlanSieges;
    occupes: string[];
    choisis: string[];
    onBasculer: (numero: string) => void;
}) {
    const pris = new Set(occupes);
    return (
        <div className="plan-sieges" style={{ gridTemplateColumns: `repeat(${plan.colonnes}, 44px)` }} role="group" aria-label="Plan du véhicule">
            {plan.rangees.map((rangee) =>
                rangee.cases.map((c, i) => {
                    const cle = `${rangee.numero}-${i}`;
                    if (estSiege(c)) {
                        const occupe = pris.has(c.numero);
                        const choisi = choisis.includes(c.numero);
                        return (
                            <button
                                key={cle}
                                type="button"
                                className={`siege ${occupe ? 'siege-pris' : ''} ${choisi ? 'siege-choisi' : ''}`}
                                aria-label={`Siège ${c.numero}${occupe ? ', pris' : choisi ? ', choisi' : ', libre'}`}
                                aria-pressed={choisi}
                                disabled={occupe}
                                onClick={() => onBasculer(c.numero)}
                            >
                                {occupe ? '✕' : c.numero}
                            </button>
                        );
                    }
                    if (c.type === 'CHAUFFEUR') {
                        return (
                            <span key={cle} className="plan-case plan-chauffeur" aria-label="Chauffeur" title="Chauffeur">
                                ◎
                            </span>
                        );
                    }
                    if (c.type === 'ALLEE') {
                        return (
                            <span key={cle} className="plan-case plan-allee">
                                {rangee.numero > 0 ? rangee.numero : ''}
                            </span>
                        );
                    }
                    return <span key={cle} className="plan-case" />;
                })
            )}
        </div>
    );
}

export function LegendeSieges() {
    return (
        <div className="legende-sieges" aria-hidden="true">
            <span>
                <i className="siege siege-echantillon" /> Libre
            </span>
            <span>
                <i className="siege siege-echantillon siege-pris" /> Pris
            </span>
            <span>
                <i className="siege siege-echantillon siege-choisi" /> Votre choix
            </span>
        </div>
    );
}
