import { commandeUuidDeNotification, estDemandeAvis, type AppNotification } from '@sira/core';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
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
 * Expo Go ne reçoit plus de notifications poussées depuis le SDK 53 : il faut
 * une construction de développement ou un APK. Dans Expo Go, ce module ne
 * charge donc même pas `expo-notifications`, dont le seul import écrit un
 * avertissement dans le journal ; les notifications in-app, elles,
 * fonctionnent partout.
 */

/** Expo Go, par opposition à une construction de développement ou au magasin. */
const dansExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type ModuleNotifications = typeof import('expo-notifications');
let moduleCharge: Promise<ModuleNotifications | null> | null = null;

/** Charge `expo-notifications` une seule fois, et jamais dans Expo Go. */
function moduleNotifications(): Promise<ModuleNotifications | null> {
    if (dansExpoGo) return Promise.resolve(null);
    if (!moduleCharge) {
        moduleCharge = import('expo-notifications')
            .then((m) => {
                // Affichée même quand l'application est au premier plan : un paiement
                // confirmé ou un départ imminent ne doit pas passer inaperçu.
                m.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowBanner: true,
                        shouldShowList: true,
                        shouldPlaySound: true,
                        shouldSetBadge: false
                    })
                });
                return m;
            })
            .catch(() => null);
    }
    return moduleCharge;
}

/** Demande la permission puis enregistre le jeton. Silencieux en cas de refus, de simulateur ou d'Expo Go. */
export async function enregistrerAppareil(): Promise<void> {
    if (dansExpoGo || !Device.isDevice || Platform.OS !== 'android') return;
    const Notifications = await moduleNotifications();
    if (!Notifications) return;
    try {
        const { status } = await Notifications.getPermissionsAsync();
        const accorde = status === 'granted' ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
        if (accorde !== 'granted') return;

        // Canal Android obligatoire pour qu'une notification s'affiche (API 26+).
        // « sound » attend le nom d'un fichier embarqué dans l'application ;
        // l'omettre laisse Android jouer la sonnerie de notification du
        // téléphone, ce que nous voulons — sans quoi le journal se plaint d'un
        // son « default » introuvable à chaque enregistrement.
        await Notifications.setNotificationChannelAsync('voyages', {
            name: 'Voyages et paiements',
            importance: Notifications.AndroidImportance.HIGH
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

/**
 * Tap sur une notification poussée : ouvrir la bonne page. Renvoie la fonction
 * de désabonnement ; si elle est appelée avant que le module soit chargé,
 * l'abonnement n'est simplement jamais pris.
 */
export function ecouterTapsNotifications(): () => void {
    let actif = true;
    let abonnement: { remove(): void } | null = null;
    void moduleNotifications().then((Notifications) => {
        if (!Notifications || !actif) return;
        abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
            const donnees = (reponse.notification.request.content.data ?? {}) as Record<string, unknown>;
            const cible = destinationNotification(donnees);
            if (cible) router.push(cible as never);
        });
    });
    return () => {
        actif = false;
        abonnement?.remove();
    };
}
