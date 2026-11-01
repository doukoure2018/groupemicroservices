import { Redirect, useLocalSearchParams } from 'expo-router';
import { paiementEnCours } from '../../reservation/paiement-en-cours';
import { EtatVide } from '../../ui/base';

/**
 * Porte d'entrée du retour de paiement quand l'adresse ne porte pas la
 * référence dans son chemin (voir `retour/[reference]` pour le cas normal).
 *
 * On lit alors ce que le prestataire a pu ajouter en requête — ils ne
 * nomment pas tous la référence de la même façon — et, à défaut, le paiement
 * que l'application vient elle-même d'ouvrir : c'est presque toujours lui.
 */
export default function RetourPaiement() {
    const params = useLocalSearchParams<Record<string, string | undefined>>();
    const reference =
        params.reference ??
        params.operation_id ??
        params.cpm_trans_id ??
        params.transaction_id ??
        params.order_id ??
        params.merchant_transaction_id ??
        paiementEnCours();

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
