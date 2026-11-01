package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Les deux interrupteurs de l'écran « Préférences de notification ». */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferencesNotification {
    /** Nouvelles du voyage : réservation, paiement, départ, remplissage, demande d'avis. */
    private boolean misesAJourTrajet;
    /** Remises, promotions, nouveautés. */
    private boolean promotions;
}
