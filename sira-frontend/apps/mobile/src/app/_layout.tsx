import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../auth/contexte';
import { couleurs } from '../ui/theme';

/**
 * Racine de l'application. Les fournisseurs sont posés ici une fois pour
 * toutes : requêtes mises en cache, session, zones sûres de l'écran.
 */
export default function Racine() {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    // Sur mobile le réseau est intermittent : une erreur passagère ne
                    // doit pas vider l'écran, et deux essais suffisent avant d'abandonner.
                    queries: { retry: 2, staleTime: 30_000 }
                }
            })
    );

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerStyle: { backgroundColor: couleurs.vert },
                            headerTintColor: couleurs.blanc,
                            headerTitleStyle: { fontWeight: '700' },
                            headerBackTitle: 'Retour',
                            contentStyle: { backgroundColor: couleurs.fond }
                        }}
                    >
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="connexion" options={{ title: 'Connexion', headerShown: false }} />
                        <Stack.Screen name="inscription" options={{ title: 'Créer un compte' }} />
                        <Stack.Screen name="mot-de-passe-oublie" options={{ title: 'Mot de passe oublié' }} />
                        <Stack.Screen name="verify" options={{ title: 'Activation', headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="recherche" options={{ title: 'Voyages disponibles' }} />
                        <Stack.Screen name="offre/[uuid]" options={{ title: 'Détail du voyage' }} />
                        <Stack.Screen name="reserver/[uuid]" options={{ title: 'Réserver' }} />
                        <Stack.Screen name="paiement/[reference]" options={{ title: 'Paiement', headerBackVisible: false }} />
                        <Stack.Screen name="commande/[uuid]" options={{ title: 'Vos billets' }} />
                        <Stack.Screen name="modifier-date/[uuid]" options={{ title: 'Changer de date' }} />
                        <Stack.Screen name="noter/[uuid]" options={{ title: 'Noter le voyage' }} />
                    </Stack>
                </AuthProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
