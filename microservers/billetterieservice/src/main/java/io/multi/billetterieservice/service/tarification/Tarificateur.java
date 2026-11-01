package io.multi.billetterieservice.service.tarification;

import io.multi.billetterieservice.domain.Devis;
import io.multi.billetterieservice.domain.LigneDevis;
import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

/**
 * Le seul endroit où un prix de réservation se calcule. Le devis affiché au
 * client et le montant enregistré à la commande sortent de la même méthode,
 * avec les mêmes entrées : ils ne peuvent pas diverger.
 */
@Component
public class Tarificateur {

    public static final String ADULTE = "ADULTE";
    public static final String ENFANT = "ENFANT";

    private final int ageAdulteMinimum;
    private final BigDecimal fraisService;

    public Tarificateur(@Value("${billetterie.age-adulte-minimum:15}") int ageAdulteMinimum,
                        @Value("${billetterie.frais-service:5000}") BigDecimal fraisService) {
        this.ageAdulteMinimum = ageAdulteMinimum;
        this.fraisService = fraisService == null ? BigDecimal.ZERO : fraisService;
    }

    public int getAgeAdulteMinimum() {
        return ageAdulteMinimum;
    }

    /** Âge révolu le jour du voyage, et non aujourd'hui : un enfant peut devenir adulte entre la réservation et le départ. */
    public int ageLeJour(LocalDate naissance, LocalDate jour) {
        return Period.between(naissance, jour).getYears();
    }

    public boolean estEnfant(LocalDate naissance, LocalDate jourDuVoyage) {
        return ageLeJour(naissance, jourDuVoyage) < ageAdulteMinimum;
    }

    /**
     * @param fraisPourcentage frais du mode de règlement, en pourcentage du total ; null si aucun mode
     * @param fraisFixe        frais fixes du mode ; null si aucun mode
     */
    public Devis devis(Offre offre, int nombreAdultes, int nombreEnfants, int nombreBagages,
                       BigDecimal fraisPourcentage, BigDecimal fraisFixe) {
        if (nombreAdultes < 1) {
            throw new ApiException("Au moins un adulte doit voyager");
        }
        if (nombreEnfants < 0 || nombreBagages < 0) {
            throw new ApiException("Composition de la réservation invalide");
        }
        boolean bagagesAutorises = !Boolean.FALSE.equals(offre.getBagagesAutorises());
        if (nombreBagages > 0 && !bagagesAutorises) {
            throw new ApiException("Ce transporteur n'accepte pas de bagage supplémentaire sur ce voyage");
        }

        BigDecimal montantAdulte = offre.getMontantEffectif();
        BigDecimal montantEnfant = offre.getMontantEnfantEffectif();
        BigDecimal montantBagage = offre.getMontantBagageEffectif();
        int places = nombreAdultes + nombreEnfants;
        int inclusParPassager = offre.getBagagesInclusParPassager() != null ? offre.getBagagesInclusParPassager() : 1;

        BigDecimal montantAdultes = montantAdulte.multiply(BigDecimal.valueOf(nombreAdultes));
        BigDecimal montantEnfants = montantEnfant.multiply(BigDecimal.valueOf(nombreEnfants));
        BigDecimal montantBagages = montantBagage.multiply(BigDecimal.valueOf(nombreBagages));
        BigDecimal montantPlaces = montantAdultes.add(montantEnfants);
        BigDecimal montantTotal = montantPlaces.add(montantBagages).add(fraisService);

        // Les frais du mode portent sur ce qui est réellement réglé, arrondis au franc.
        BigDecimal montantFraisPaiement = BigDecimal.ZERO;
        if (fraisPourcentage != null && fraisPourcentage.signum() > 0) {
            montantFraisPaiement = montantTotal.multiply(fraisPourcentage).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
        }
        if (fraisFixe != null && fraisFixe.signum() > 0) {
            montantFraisPaiement = montantFraisPaiement.add(fraisFixe);
        }

        List<LigneDevis> lignes = new ArrayList<>();
        lignes.add(new LigneDevis("ADULTES", nombreAdultes > 1 ? "Adultes" : "Adulte", nombreAdultes, montantAdulte, montantAdultes));
        if (nombreEnfants > 0) {
            lignes.add(new LigneDevis("ENFANTS", nombreEnfants > 1 ? "Enfants" : "Enfant", nombreEnfants, montantEnfant, montantEnfants));
        }
        if (nombreBagages > 0) {
            lignes.add(new LigneDevis("BAGAGES", nombreBagages > 1 ? "Bagages supplémentaires" : "Bagage supplémentaire",
                    nombreBagages, montantBagage, montantBagages));
        }
        if (fraisService.signum() > 0) {
            lignes.add(new LigneDevis("FRAIS_SERVICE", "Frais de service", 1, fraisService, fraisService));
        }
        if (montantFraisPaiement.signum() > 0) {
            lignes.add(new LigneDevis("FRAIS_PAIEMENT", "Frais de paiement", 1, montantFraisPaiement, montantFraisPaiement));
        }

        return Devis.builder()
                .offreUuid(offre.getOffreUuid())
                .devise(offre.getDevise() != null ? offre.getDevise() : "GNF")
                .nombreAdultes(nombreAdultes)
                .nombreEnfants(nombreEnfants)
                .nombreBagages(nombreBagages)
                .bagagesInclus(inclusParPassager * places)
                .bagagesAutorises(bagagesAutorises)
                .montantAdulte(montantAdulte)
                .montantEnfant(montantEnfant)
                .montantBagage(montantBagage)
                .lignes(lignes)
                .montantPlaces(montantPlaces)
                .montantBagages(montantBagages)
                .montantFraisService(fraisService)
                .montantTotal(montantTotal)
                .montantFraisPaiement(montantFraisPaiement)
                .montantAPayer(montantTotal.add(montantFraisPaiement))
                .ageAdulteMinimum(ageAdulteMinimum)
                .build();
    }
}
