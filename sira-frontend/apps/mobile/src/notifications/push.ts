import { commandeUuidDeNotification, estDemandeAvis, type AppNotification } from '@sira/core';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { api } from '../api';

/**
 * Notifications poussées. Le serveur envoie par FCM, avec dans les données la
 * catégorie et l'identifiant de commande : au tap, on ouvre directement
 * l'écran utile. Sur Android, le jeton natif de l'appareil est un jeton FCM,
 * exactement ce que le serveur attend. Sur iOS ce serait un jeton APNs, que
 * le serveur ne saurait pas utiliser sans le SDK Firebase : rien n'est
 * enregistré tant que cette chaîne n'est pas décidée.
 *
 * Expo Go ne reçoit plus de notifications poussées sur Android depuis le SDK
 * 53 : il faut une construction de développement ou un APK. Les notifications
 * in-app, elles, fonctionnent partout.
 */

// Affichée même quand l'application est au premier plan : un paiement
// confirmé ou un départ imminent ne doit pas passer inaperçu.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false
    })
});

/** Demande la permission puis enregistre le jeton. Silencieux en cas de refus ou de simulateur. */
export async function enregistrerAppareil(): Promise<void> {
    if (!Device.isDevice || Platform.OS !== 'android') return;
    try {
        const { status } = await Notifications.getPermissionsAsync();
        const accorde = status === 'granted' ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
        if (accorde !== 'granted') return;

        // Canal Android obligatoire pour qu'une notification s'affiche (API 26+).
        await Notifications.setNotificationChannelAsync('voyages', {
            name: 'Voyages et paiements',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default'
        });

        const jeton = await Notifications.getDevicePushTokenAsync();
        if (typeof jeton.data === 'string' && jeton.data) {
            await api.notifications.registerDeviceToken(jeton.data, 'ANDROID');
        }
    } catch {
        // Ni Firebase ni le serveur ne doivent empêcher l'application de vivre :
        // sans jeton, le client garde les notifications in-app.
    }
}

/** Données portées par un push ou une notification in-app, ramenées à une destination. */
export function destinationNotification(donnees: Record<string, unknown> | AppNotification): string | null {
    const categorie = String((donnees as Record<string, unknown>)['categorie'] ?? (donnees as AppNotification).categorie ?? '').toUpperCase();
    const commandeUuid =
        typeof (donnees as Record<string, unknown>)['commandeUuid'] === 'string'
            ? ((donnees as Record<string, unknown>)['commandeUuid'] as string)
            : commandeUuidDeNotification(donnees as AppNotification);

    if (commandeUuid && (categorie.includes('AVIS') || estDemandeAvis(donnees as AppNotification))) {
        return `/noter/${commandeUuid}`;
    }
    if (commandeUuid) return `/commande/${commandeUuid}`;
    return '/notifications';
}

/** Tap sur une notification poussée : ouvrir la bonne page. Renvoie la fonction de désabonnement. */
export function ecouterTapsNotifications(): () => void {
    const abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
        const donnees = (reponse.notification.request.content.data ?? {}) as Record<string, unknown>;
        const cible = destinationNotification(donnees);
        if (cible) router.push(cible as never);
    });
    return () => abonnement.remove();
}
