import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { couleurs } from './theme';

/** Un billet incliné : le seul ornement de l'onglet Billets quand il est vide. */
export function IllustrationBillet({ largeur = 180 }: { largeur?: number }) {
    return (
        <Svg width={largeur} height={largeur * 0.75} viewBox="0 0 160 120" accessible={false}>
            <Circle cx="80" cy="60" r="56" fill={couleurs.vertPale} />
            <G rotation="-8" origin="80, 60">
                <Rect x="24" y="36" width="112" height="48" rx="8" fill={couleurs.blanc} stroke={couleurs.vert} strokeWidth="2.5" />
                <Line x1="104" y1="38" x2="104" y2="82" stroke={couleurs.vert} strokeWidth="2" strokeDasharray="4 4" />
                <Circle cx="104" cy="36" r="5" fill={couleurs.vertPale} />
                <Circle cx="104" cy="84" r="5" fill={couleurs.vertPale} />
                <Rect x="36" y="48" width="40" height="6" rx="3" fill={couleurs.vert} />
                <Rect x="36" y="60" width="28" height="6" rx="3" fill={couleurs.ligne} />
                <Rect x="36" y="70" width="52" height="6" rx="3" fill={couleurs.ligne} />
                <Rect x="112" y="52" width="16" height="16" rx="2" fill={couleurs.or} />
            </G>
        </Svg>
    );
}
