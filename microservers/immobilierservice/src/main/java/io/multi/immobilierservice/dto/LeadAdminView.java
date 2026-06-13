package io.multi.immobilierservice.dto;

import io.multi.immobilierservice.domain.Contact;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vue back-office d'un lead : le {@link Contact} complet (snapshot prospect +
 * champs d'audit lead_statut/note_admin/traite_par/traite_at) enrichi de la
 * référence et du titre de la propriété concernée (join immo_propriete), pour
 * affichage direct dans le dashboard admin sans lookup supplémentaire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadAdminView {
    private Contact contact;
    private String proprieteReference;
    private String proprieteTitre;
}
