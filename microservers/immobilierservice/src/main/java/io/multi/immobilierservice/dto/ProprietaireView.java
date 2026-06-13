package io.multi.immobilierservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Coordonnées du propriétaire d'une annonce, exposées au back-office (intermédiation)
 * pour relayer un lead. Résolu via ProfilImmo.userId → UserClient (compte réel).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProprietaireView {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String telephone;
    private String address;
    private String typeProfil;
}
