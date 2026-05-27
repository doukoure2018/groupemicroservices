package io.multi.immobilierservice.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Critères de recherche pour {@code GET /immo/proprietes/recherche}.
 * Tous les champs sont optionnels — un seul est obligatoire en pratique :
 * {@code statut} (par défaut PUBLIE).
 */
@Data
public class ProprieteSearchCriteria {

    private String typeAnnonce;             // LOCATION | VENTE
    private String dureeLocation;           // COURT_SEJOUR | LONG_SEJOUR
    private List<String> typeBienCodes;     // MAISON, APPARTEMENT, ...

    private String villeUuid;
    private String communeUuid;
    private String quartierUuid;

    private BigDecimal prixMin;
    private BigDecimal prixMax;
    private String devise;                  // filtrer sur devise stockée (GNF/USD/EUR)

    private Integer chambresMin;
    private BigDecimal surfaceMin;

    /** Toutes les commodités listées doivent être présentes (AND). */
    private List<String> commoditesCodes;

    /** Recherche full-text light (titre / description / adresse). */
    private String q;

    // ---- recherche spatiale ----
    private Double lat;
    private Double lng;
    private Double rayonKm;                 // converti en mètres au passage en SQL

    /** Tri whitelisté : PRIX_ASC | PRIX_DESC | DATE_DESC | DISTANCE_ASC | PERTINENCE. */
    private String trier;

    private Integer limit = 20;
    private Integer offset = 0;

    /**
     * <b>Set par le controller depuis le JWT</b> — jamais accepté en query param
     * (sinon un user pourrait spoofer l'identité d'un autre pour voir ses favoris).
     * Null = requête anonyme → {@code isFavorite} restera null dans les résultats.
     */
    private Long currentUserId;

    public String trierOrDefault() {
        if (trier == null || trier.isBlank()) {
            // Si géo fournie → tri distance, sinon date desc.
            return (lat != null && lng != null) ? "DISTANCE_ASC" : "DATE_DESC";
        }
        return trier;
    }
}
