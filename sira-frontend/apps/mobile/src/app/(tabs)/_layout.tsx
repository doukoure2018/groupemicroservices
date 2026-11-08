import { useQuery } from '@tanstack/react-query';
import { Redirect, Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, type ColorValue } from 'react-native';
import { hasRole } from '@sira/core';
import { api } from '../../api';
import { ecouterTapsNotifications, enregistrerAppareil } from '../../notifications/push';
import { useAuth } from '../../auth/contexte';
import { Chargement } from '../../ui/base';
import { SelecteurUnivers } from '../../ui/selecteur-univers';
import { couleurs } from '../../ui/theme';
import { chargerUnivers, useUnivers } from '../../univers';

/** Icônes en texte pour ne dépendre d'aucune police d'icônes au démarrage. */
function Icone({ symbole, color }: { symbole: string; color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{symbole}</Text>;
}

/**
 * Une seule barre d'onglets, dont la composition dépend de l'univers :
 * Réservation · Billets · Contrôle · Compte pour Voyager, Recherche · Favoris
 * · Compte pour Me loger (Demandes arrive avec le lot I2). Les
 * onglets de l'autre univers sont retirés de la barre (`href: null`) mais
 * restent joignables : une notification de voyage ouvre toujours ses billets.
 * On ne réaligne pas l'univers sur l'onglet affiché : changer la composition
 * de la barre pendant une navigation relançait la navigation, sans fin.
 *
 * Les onglets se visitent sans compte : chercher n'exige rien. Ce sont les
 * écrans qui ont besoin d'une session qui la demandent, via ExigerSession.
 */
export default function Onglets() {
    const { user } = useAuth();
    const connecte = !!user;
    const { univers, pret } = useUnivers();

    useEffect(() => {
        void chargerUnivers();
    }, []);

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

    if (user === undefined || !pret) return <Chargement texte="Ouverture de l'application…" />;
    // Un compte né d'une connexion Google n'a pas d'adresse : on la demande
    // une fois, comme l'inscription par email l'exige dès le départ.
    if (user && !user.address) return <Redirect href="/completer-profil" />;
    if (univers === null) return <Redirect href="/choisir-univers" />;

    // Le contrôle des billets n'est montré qu'aux rôles qui ont le droit de
    // valider ; le serveur applique la même règle, l'onglet n'est qu'un confort.
    const controleur = !!user && (hasRole(user, 'CONTROLEUR') || hasRole(user, 'SUPER_ADMIN') || hasRole(user, 'ADMIN'));
    const voyager = univers === 'voyager';

    const cloche = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${nonLues.data ? `, ${nonLues.data} non lue${nonLues.data > 1 ? 's' : ''}` : ''}`}
            onPress={() => router.push('/notifications')}
            style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
            <Text style={{ fontSize: 20, color: couleurs.blanc }}>🔔</Text>
            {!!nonLues.data && (
                <Text style={{ backgroundColor: couleurs.or, color: couleurs.encre, fontWeight: '700', fontSize: 12, borderRadius: 999, paddingHorizontal: 6, overflow: 'hidden' }}>
                    {nonLues.data > 9 ? '9+' : nonLues.data}
                </Text>
            )}
        </Pressable>
    );
    const selecteur = () => <SelecteurUnivers />;

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: couleurs.vert },
                headerTintColor: couleurs.blanc,
                headerTitleStyle: { fontWeight: '700' },
                tabBarActiveTintColor: couleurs.vert,
                tabBarInactiveTintColor: couleurs.gris,
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
                tabBarStyle: { borderTopColor: couleurs.ligne },
                sceneStyle: { backgroundColor: couleurs.fond },
                headerRight: connecte ? () => cloche : undefined
            }}
        >
            {/* Voyager */}
            <Tabs.Screen
                name="index"
                options={{ title: 'Réservation', href: voyager ? undefined : null, headerTitle: selecteur, headerTitleAlign: 'left', tabBarIcon: ({ color }) => <Icone symbole="⌕" color={color} /> }}
            />
            <Tabs.Screen name="voyages" options={{ title: 'Billets', href: voyager ? undefined : null, tabBarIcon: ({ color }) => <Icone symbole="▣" color={color} /> }} />
            <Tabs.Screen
                name="scanner"
                options={{ title: 'Contrôle', href: voyager && controleur ? undefined : null, tabBarIcon: ({ color }) => <Icone symbole="⌗" color={color} /> }}
            />
            {/* Me loger */}
            <Tabs.Screen
                name="biens"
                options={{ title: 'Recherche', href: voyager ? null : undefined, headerTitle: selecteur, headerTitleAlign: 'left', tabBarIcon: ({ color }) => <Icone symbole="⌂" color={color} /> }}
            />
            <Tabs.Screen name="favoris" options={{ title: 'Favoris', href: voyager ? null : undefined, tabBarIcon: ({ color }) => <Icone symbole="♥" color={color} /> }} />
            {/* Commun */}
            <Tabs.Screen name="compte" options={{ title: 'Compte', tabBarIcon: ({ color }) => <Icone symbole="◉" color={color} /> }} />
        </Tabs>
    );
}
