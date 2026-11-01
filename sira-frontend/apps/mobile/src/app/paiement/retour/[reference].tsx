import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Retour de paiement avec la référence dans le chemin — la forme que le
 * serveur donne au prestataire. Le lien d'application Android remet cette
 * adresse directement ici ; on repart sur l'écran d'attente, qui sait
 * interroger l'état du paiement et enchaîner sur les billets.
 */
export default function RetourPaiementReference() {
    const { reference } = useLocalSearchParams<{ reference: string }>();
    return <Redirect href={{ pathname: '/paiement/[reference]', params: { reference } }} />;
}
