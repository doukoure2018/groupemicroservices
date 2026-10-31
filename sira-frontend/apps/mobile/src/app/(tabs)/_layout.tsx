import { useQuery } from '@tanstack/react-query';
import { Redirect, Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, type ColorValue } from 'react-native';
import { hasRole } from '@sira/core';
import { api } from '../../api';
import { ecouterTapsNotifications, enregistrerAppareil } from '../../notifications/push';
import { useAuth } from '../../auth/contexte';
import { Chargement } from '../../ui/base';
import { couleurs } from '../../ui/theme';

/** Icônes en texte pour ne dépendre d'aucune police d'icônes au démarrage. */
function Icone({ symbole, color }: { symbole: string; color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{symbole}</Text>;
}

export default function Onglets() {
    const { user } = useAuth();
    const connecte = !!user;

    // Une fois connecté : jeton d'appareil enregistré, taps sur les pushs écoutés.
    useEffect(() => {
        if (!connecte) return;
        void enregistrerAppareil();
        return ecouterTapsNotifications();
    }, [connecte]);

    const nonLues = useQuery({
        queryKey: ['notifications-non-lues'],
        queryFn: async () => (await api.notifications.unreadCount()).data.unreadCount ?? 0,
        enabled: connecte,
        refetchInterval: 60_000
    });

    if (user === undefined) return <Chargement />;
    // Toute la zone connectée passe par ici : pas de session, pas d'onglets.
    if (user === null) return <Redirect href="/connexion" />;

    // Le contrôle des billets n'est montré qu'aux rôles qui ont le droit de
    // valider ; le serveur applique la même règle, l'onglet n'est qu'un confort.
    const controleur = hasRole(user, 'CONTROLEUR') || hasRole(user, 'SUPER_ADMIN') || hasRole(user, 'ADMIN');

    const cloche = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${nonLues.data ? `, ${nonLues.data} non lue${nonLues.data > 1 ? 's' : ''}` : ''}`}
            onPress={() => router.push('/notifications')}
            style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
            <Text style={{ fontSize: 20, color: couleurs.blanc }}>🔔</Text>
            {!!nonLues.data && (
                <Text style={{ backgroundColor: couleurs.or, color: couleurs.vertFonce, fontWeight: '800', fontSize: 12, borderRadius: 999, paddingHorizontal: 6, overflow: 'hidden' }}>
                    {nonLues.data > 9 ? '9+' : nonLues.data}
                </Text>
            )}
        </Pressable>
    );

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: couleurs.vert },
                headerTintColor: couleurs.blanc,
                headerTitleStyle: { fontWeight: '700' },
                tabBarActiveTintColor: couleurs.vert,
                tabBarInactiveTintColor: couleurs.gris,
                tabBarStyle: { borderTopColor: couleurs.ligne },
                sceneStyle: { backgroundColor: couleurs.fond },
                headerRight: () => cloche
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <Icone symbole="⌂" color={color} /> }} />
            <Tabs.Screen name="voyages" options={{ title: 'Mes voyages', tabBarIcon: ({ color }) => <Icone symbole="▣" color={color} /> }} />
            <Tabs.Screen
                name="scanner"
                options={{ title: 'Contrôle', href: controleur ? undefined : null, tabBarIcon: ({ color }) => <Icone symbole="⌗" color={color} /> }}
            />
            <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Icone symbole="◉" color={color} /> }} />
        </Tabs>
    );
}
