import { Redirect, useLocalSearchParams } from 'expo-router';
import { EtatVide } from '../../ui/base';

/**
 * Porte d'entrée du retour de paiement.
 *
 * Deux chemins y mènent : le lien d'application Android, quand le prestataire
 * renvoie vers `https://…/paiement/retour` et qu'Android reconnaît l'adresse
 * comme appartenant à l'application ; et le renvoi de la page du site, qui
 * rebondit vers le même chemin par le schéma de l'application. Dans les deux
 * cas on revient à l'écran d'attente, qui sait interroger l'état du paiement.
 *
 * Les prestataires ne nomment pas la référence de la même façon : Chap Chap
 * Pay renvoie son identifiant d'opération, CinetPay le sien. Le serveur sait
 * reconnaître les deux, il suffit de lui transmettre ce qui est arrivé.
 */
export default function RetourPaiement() {
    const params = useLocalSearchParams<Record<string, string | undefined>>();
    const reference =
        params.reference ?? params.operation_id ?? params.cpm_trans_id ?? params.transaction_id ?? params.order_id ?? params.merchant_transaction_id;

    if (!reference) {
        return (
            <EtatVide
                titre="Paiement introuvable"
                texte="Nous n'avons pas retrouvé la référence de ce paiement. Ouvrez « Billets » : votre réservation y figure avec son statut."
            />
        );
    }
    return <Redirect href={{ pathname: '/paiement/[reference]', params: { reference } }} />;
}
