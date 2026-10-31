import { Redirect } from 'expo-router';
import { useAuth } from '../auth/contexte';
import { Chargement } from '../ui/base';

/** Aiguillage au démarrage : session relue depuis le trousseau, puis onglets ou connexion. */
export default function Index() {
    const { user } = useAuth();
    if (user === undefined) return <Chargement texte="Ouverture de votre session…" />;
    return <Redirect href={user ? '/(tabs)' : '/connexion'} />;
}
