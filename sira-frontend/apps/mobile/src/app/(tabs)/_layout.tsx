import { Redirect, Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useAuth } from '../../auth/contexte';
import { Chargement } from '../../ui/base';
import { couleurs } from '../../ui/theme';

/** Icônes en texte pour ne dépendre d'aucune police d'icônes au démarrage. */
function Icone({ symbole, color }: { symbole: string; color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{symbole}</Text>;
}

export default function Onglets() {
    const { user } = useAuth();
    if (user === undefined) return <Chargement />;
    // Toute la zone connectée passe par ici : pas de session, pas d'onglets.
    if (user === null) return <Redirect href="/connexion" />;

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: couleurs.vert },
                headerTintColor: couleurs.blanc,
                headerTitleStyle: { fontWeight: '700' },
                tabBarActiveTintColor: couleurs.vert,
                tabBarInactiveTintColor: couleurs.gris,
                tabBarStyle: { borderTopColor: couleurs.ligne },
                sceneStyle: { backgroundColor: couleurs.fond }
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <Icone symbole="⌂" color={color} /> }} />
            <Tabs.Screen name="voyages" options={{ title: 'Mes voyages', tabBarIcon: ({ color }) => <Icone symbole="▣" color={color} /> }} />
            <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Icone symbole="◉" color={color} /> }} />
        </Tabs>
    );
}
