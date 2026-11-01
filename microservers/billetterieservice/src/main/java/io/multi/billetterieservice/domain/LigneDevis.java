package io.multi.billetterieservice.domain;

import java.math.BigDecimal;

/** Une ligne du récapitulatif présenté au client : « 2 adultes × 50 000 = 100 000 ». */
public record LigneDevis(String code, String libelle, int quantite, BigDecimal montantUnitaire, BigDecimal montant) {
}
