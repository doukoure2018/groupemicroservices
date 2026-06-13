package io.multi.immobilierservice.dto;

import io.multi.immobilierservice.domain.Visite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vue back-office d'un lead visite : la {@link Visite} complète (incl. champs
 * d'audit lead_statut/note_admin/traite_par/traite_at) enrichie de la référence
 * et du titre de la propriété (join immo_propriete). Pas d'enrichissement live
 * du visiteur (id seul) — symétrie volontairement plus simple que le contact.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadVisiteAdminView {
    private Visite visite;
    private String proprieteReference;
    private String proprieteTitre;
}
