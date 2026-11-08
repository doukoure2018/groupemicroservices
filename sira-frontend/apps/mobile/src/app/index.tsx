import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Chargement } from '../ui/base';
import { chargerUnivers, UNIVERS, useUnivers } from '../univers';

/**
 * Aiguillage : l'application rouvre le dernier univers utilisé ; au tout
 * premier lancement, elle demande lequel. La session, si elle existe dans le
 * trousseau, se relit pendant ce temps.
 */
export default function Index() {
    const { univers, pret } = useUnivers();
    useEffect(() => {
        void chargerUnivers();
    }, []);
    if (!pret) return <Chargement />;
    if (univers === null) return <Redirect href="/choisir-univers" />;
    return <Redirect href={UNIVERS[univers].accueil} />;
}
