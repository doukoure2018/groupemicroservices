import type { Ville } from '@sira/core';
import { useMemo, useState } from 'react';

/**
 * Carte stylisée de la Guinée : contour réel du pays, axes routiers principaux
 * et villes cliquables. Les villes sont des vrais <button> HTML posés par-dessus
 * le SVG (coordonnées en pourcentage) plutôt que des <g> cliquables : on garde
 * le clavier, le focus visible et l'attribut disabled sans réinventer un rôle.
 */

interface VilleCarte {
    id: string;
    nom: string;
    lon: number;
    lat: number;
    capitale?: boolean;
    /** Côté où poser le nom pour éviter les chevauchements aux bords du pays. */
    etiquette: 'gauche' | 'droite' | 'haut' | 'bas';
}

/** Contour du pays (longitude, latitude), repris de la carte Angular. */
const CONTOUR_GUINEE: [number, number][] = [
    [-8.439298, 7.686043], [-8.722124, 7.711674], [-8.926065, 7.309037], [-9.208786, 7.313921],
    [-9.403348, 7.526905], [-9.33728, 7.928534], [-9.755342, 8.541055], [-10.016567, 8.428504],
    [-10.230094, 8.406206], [-10.505477, 8.348896], [-10.494315, 8.715541], [-10.65477, 8.977178],
    [-10.622395, 9.26791], [-10.839152, 9.688246], [-11.117481, 10.045873], [-11.917277, 10.046984],
    [-12.150338, 9.858572], [-12.425929, 9.835834], [-12.596719, 9.620188], [-12.711958, 9.342712],
    [-13.24655, 8.903049], [-13.685154, 9.494744], [-14.074045, 9.886167], [-14.330076, 10.01572],
    [-14.579699, 10.214467], [-14.693232, 10.656301], [-14.839554, 10.876572], [-15.130311, 11.040412],
    [-14.685687, 11.527824], [-14.382192, 11.509272], [-14.121406, 11.677117], [-13.9008, 11.678719],
    [-13.743161, 11.811269], [-13.828272, 12.142644], [-13.718744, 12.247186], [-13.700476, 12.586183],
    [-13.217818, 12.575874], [-12.499051, 12.33209], [-12.278599, 12.35444], [-12.203565, 12.465648],
    [-11.658301, 12.386583], [-11.513943, 12.442988], [-11.456169, 12.076834], [-11.297574, 12.077971],
    [-11.036556, 12.211245], [-10.87083, 12.177887], [-10.593224, 11.923975], [-10.165214, 11.844084],
    [-9.890993, 12.060479], [-9.567912, 12.194243], [-9.327616, 12.334286], [-9.127474, 12.30806],
    [-8.905265, 12.088358], [-8.786099, 11.812561], [-8.376305, 11.393646], [-8.581305, 11.136246],
    [-8.620321, 10.810891], [-8.407311, 10.909257], [-8.282357, 10.792597], [-8.335377, 10.494812],
    [-8.029944, 10.206535], [-8.229337, 10.12902], [-8.309616, 9.789532], [-8.079114, 9.376224],
    [-7.8321, 8.575704], [-8.203499, 8.455453], [-8.299049, 8.316444], [-8.221792, 8.123329],
    [-8.280703, 7.68718], [-8.439298, 7.686043]
];

const LON_MIN = -15.25;
const LON_MAX = -7.7;
const LAT_MIN = 7.2;
const LAT_MAX = 12.7;
const SVG_W = 500;
const SVG_H = 380;
const MARGE = 30;

/*
 * Siguiri était placée à la longitude -11.42 dans l'Angular (copie de sa
 * latitude) : la ville apparaissait au nord de Mamou au lieu du nord-est de
 * Kankan. Coordonnée corrigée ici.
 */
const VILLES_CARTE: VilleCarte[] = [
    { id: 'conakry', nom: 'Conakry', lon: -13.7123, lat: 9.537, capitale: true, etiquette: 'gauche' },
    { id: 'kankan', nom: 'Kankan', lon: -9.3057, lat: 10.3854, etiquette: 'droite' },
    { id: 'labe', nom: 'Labé', lon: -12.2891, lat: 11.3183, etiquette: 'gauche' },
    { id: 'nzerekore', nom: 'Nzérékoré', lon: -8.8179, lat: 7.7562, etiquette: 'gauche' },
    { id: 'kindia', nom: 'Kindia', lon: -12.8665, lat: 10.0604, etiquette: 'bas' },
    { id: 'mamou', nom: 'Mamou', lon: -12.0861, lat: 10.3756, etiquette: 'haut' },
    { id: 'boke', nom: 'Boké', lon: -14.2918, lat: 10.9397, etiquette: 'gauche' },
    { id: 'faranah', nom: 'Faranah', lon: -10.74, lat: 10.0404, etiquette: 'bas' },
    { id: 'siguiri', nom: 'Siguiri', lon: -9.1667, lat: 11.4167, etiquette: 'droite' },
    { id: 'kissidougou', nom: 'Kissidougou', lon: -10.0992, lat: 9.1848, etiquette: 'droite' }
];

/** Axes routiers tracés en pointillé entre deux villes de la carte. */
const AXES: [string, string][] = [
    ['conakry', 'kindia'], ['kindia', 'mamou'], ['mamou', 'labe'],
    ['mamou', 'faranah'], ['faranah', 'kankan'], ['faranah', 'kissidougou'],
    ['kissidougou', 'nzerekore'], ['conakry', 'boke'], ['labe', 'siguiri'], ['kankan', 'siguiri']
];

function versSvg(lon: number, lat: number): { x: number; y: number } {
    return {
        x: MARGE + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (SVG_W - 2 * MARGE),
        y: MARGE + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (SVG_H - 2 * MARGE)
    };
}

const CONTOUR_PATH = CONTOUR_GUINEE.map((c, i) => {
    const { x, y } = versSvg(c[0], c[1]);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
}).join(' ') + ' Z';

const POSITIONS = new Map(VILLES_CARTE.map((v) => [v.id, versSvg(v.lon, v.lat)]));

/** Compare « Labe » et « Labé » : les libellés du référentiel n'ont pas toujours les accents. */
function normaliser(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

interface Props {
    /** Villes actives chargées par la page : seules celles-ci sont cliquables. */
    villes: Ville[];
    chargement?: boolean;
    villeDepartUuid: string;
    villeArriveeUuid: string;
    onChoisirVille: (ville: Ville) => void;
}

export function CarteGuinee({ villes, chargement = false, villeDepartUuid, villeArriveeUuid, onChoisirVille }: Props) {
    const [survol, setSurvol] = useState<string | null>(null);

    // Les villes de la carte sont un dessin fixe ; on les relie aux villes réellement
    // desservies pour ne jamais proposer un départ qui n'existe pas côté backend.
    const correspondances = useMemo(() => {
        const parNom = new Map(villes.map((v) => [normaliser(v.libelle), v]));
        return new Map(VILLES_CARTE.map((vc) => [vc.id, parNom.get(normaliser(vc.nom))]));
    }, [villes]);

    const idDepart = VILLES_CARTE.find((vc) => correspondances.get(vc.id)?.villeUuid === villeDepartUuid)?.id ?? null;
    const idArrivee = VILLES_CARTE.find((vc) => correspondances.get(vc.id)?.villeUuid === villeArriveeUuid)?.id ?? null;
    const estActive = (id: string) => id === survol || id === idDepart || id === idArrivee;

    const nbDisponibles = [...correspondances.values()].filter(Boolean).length;

    return (
        <div className="acc-carte">
            <div className="acc-carte-scene">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Carte de la Guinée avec les principales villes desservies" className="acc-carte-svg">
                    <defs>
                        <pattern id="acc-carte-points" width="12" height="12" patternUnits="userSpaceOnUse">
                            <circle cx="6" cy="6" r="1.2" fill="rgba(27, 94, 59, 0.14)" />
                        </pattern>
                        <clipPath id="acc-carte-decoupe">
                            <path d={CONTOUR_PATH} />
                        </clipPath>
                    </defs>
                    <path d={CONTOUR_PATH} className="acc-carte-ombre" transform="translate(3,3)" />
                    <path d={CONTOUR_PATH} className="acc-carte-pays" />
                    <rect width={SVG_W} height={SVG_H} fill="url(#acc-carte-points)" clipPath="url(#acc-carte-decoupe)" />
                    {AXES.map(([de, vers]) => {
                        const a = POSITIONS.get(de);
                        const b = POSITIONS.get(vers);
                        if (!a || !b) return null;
                        const actif = estActive(de) || estActive(vers);
                        return <line key={`${de}-${vers}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={actif ? 'acc-carte-axe est-actif' : 'acc-carte-axe'} />;
                    })}
                </svg>

                {VILLES_CARTE.map((vc) => {
                    const pos = POSITIONS.get(vc.id)!;
                    const ville = correspondances.get(vc.id);
                    const disponible = !!ville;
                    const role = vc.id === idDepart ? 'départ' : vc.id === idArrivee ? 'arrivée' : null;
                    const classes = ['acc-carte-ville', `etiquette-${vc.etiquette}`];
                    if (vc.capitale) classes.push('est-capitale');
                    if (role) classes.push('est-choisie');
                    if (estActive(vc.id)) classes.push('est-active');
                    if (!disponible && !chargement) classes.push('est-indisponible');
                    const libelleEtat = chargement ? 'chargement des villes' : disponible ? (role ? `sélectionnée comme ${role}` : 'cliquer pour choisir cette ville') : 'indisponible pour le moment';
                    return (
                        <button
                            key={vc.id}
                            type="button"
                            className={classes.join(' ')}
                            style={{ left: `${(pos.x / SVG_W) * 100}%`, top: `${(pos.y / SVG_H) * 100}%` }}
                            disabled={!disponible}
                            aria-pressed={role ? true : undefined}
                            aria-label={`${vc.nom}, ${libelleEtat}`}
                            title={disponible ? vc.nom : `${vc.nom} : indisponible pour le moment`}
                            onMouseEnter={() => setSurvol(vc.id)}
                            onMouseLeave={() => setSurvol(null)}
                            onFocus={() => setSurvol(vc.id)}
                            onBlur={() => setSurvol(null)}
                            onClick={() => ville && onChoisirVille(ville)}
                        >
                            <span className="acc-carte-point" aria-hidden="true" />
                            <span className="acc-carte-nom" aria-hidden="true">
                                {vc.nom}
                            </span>
                        </button>
                    );
                })}
            </div>

            <ul className="acc-carte-legende" aria-label="Légende de la carte">
                <li>
                    <span className="acc-carte-puce est-capitale" aria-hidden="true" /> Capitale
                </li>
                <li>
                    <span className="acc-carte-puce" aria-hidden="true" /> Ville desservie
                </li>
                <li>
                    <span className="acc-carte-puce est-indisponible" aria-hidden="true" /> Indisponible
                </li>
            </ul>
            <p className="muted acc-carte-compteur">
                {chargement ? 'Chargement des villes desservies…' : `${nbDisponibles} ville${nbDisponibles > 1 ? 's' : ''} de la carte desservie${nbDisponibles > 1 ? 's' : ''} aujourd’hui`}
            </p>
        </div>
    );
}
