package io.multi.billetterieservice.service.tarification;

import io.multi.billetterieservice.domain.Devis;
import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Le prix d'une réservation, sans Spring ni base : la règle doit se lire ici. */
class TarificateurTest {

    private final Tarificateur tarificateur = new Tarificateur(15, new BigDecimal("5000"));

    private static Offre offre() {
        return Offre.builder()
                .offreUuid("o-1").devise("GNF")
                .montant(new BigDecimal("50000"))
                .trajetMontantEnfant(new BigDecimal("30000"))
                .trajetMontantBagages(new BigDecimal("10000"))
                .bagagesAutorises(true).bagagesInclusParPassager(1)
                .build();
    }

    @Test
    void adultesEnfantsBagagesEtFraisDeService() {
        Devis d = tarificateur.devis(offre(), 2, 1, 1, null, null);
        assertEquals(new BigDecimal("100000"), d.getMontantPlaces().subtract(d.getMontantEnfant()));
        assertEquals(new BigDecimal("30000"), d.getMontantEnfant());
        assertEquals(new BigDecimal("10000"), d.getMontantBagages());
        assertEquals(new BigDecimal("5000"), d.getMontantFraisService());
        assertEquals(new BigDecimal("145000"), d.getMontantTotal());
        assertEquals(d.getMontantTotal(), d.getMontantAPayer());
        assertEquals(3, d.getBagagesInclus());
        assertEquals(4, d.getLignes().size());
    }

    @Test
    void lOffreSurchargeLaLiaisonEtLEnfantNePaieJamaisPlusQuUnAdulte() {
        Offre o = offre();
        o.setMontantEnfant(new BigDecimal("45000"));
        o.setMontantPromotion(new BigDecimal("40000"));
        Devis d = tarificateur.devis(o, 1, 1, 0, null, null);
        assertEquals(new BigDecimal("40000"), d.getMontantAdulte());
        assertEquals(new BigDecimal("40000"), d.getMontantEnfant(), "plafonné au tarif adulte en promotion");
    }

    @Test
    void fraisDuModeSurLeTotalArrondisAuFranc() {
        Devis d = tarificateur.devis(offre(), 1, 0, 0, new BigDecimal("1.5"), new BigDecimal("500"));
        // 55 000 × 1,5 % = 825 ; + 500 fixes
        assertEquals(new BigDecimal("1325"), d.getMontantFraisPaiement());
        assertEquals(new BigDecimal("56325"), d.getMontantAPayer());
        assertEquals("FRAIS_PAIEMENT", d.getLignes().get(d.getLignes().size() - 1).code());
    }

    @Test
    void bagagesRefusesQuandLeTransporteurNEnPrendPas() {
        Offre o = offre();
        o.setBagagesAutorises(false);
        assertThrows(ApiException.class, () -> tarificateur.devis(o, 1, 0, 1, null, null));
        assertDoesNotThrow(() -> tarificateur.devis(o, 1, 0, 0, null, null));
    }

    @Test
    void auMoinsUnAdulte() {
        assertThrows(ApiException.class, () -> tarificateur.devis(offre(), 0, 2, 0, null, null));
    }

    @Test
    void lAgeSeCompteLeJourDuVoyage() {
        LocalDate voyage = LocalDate.of(2026, 11, 15);
        assertTrue(tarificateur.estEnfant(LocalDate.of(2011, 11, 16), voyage), "15 ans le lendemain du voyage : encore enfant");
        assertFalse(tarificateur.estEnfant(LocalDate.of(2011, 11, 15), voyage), "15 ans le jour même : adulte");
        assertTrue(tarificateur.estEnfant(LocalDate.of(2026, 10, 1), voyage));
    }

    @Test
    void sansFraisDeServiceLaLigneDisparait() {
        Devis d = new Tarificateur(15, BigDecimal.ZERO).devis(offre(), 1, 0, 0, null, null);
        assertEquals(new BigDecimal("50000"), d.getMontantTotal());
        assertTrue(d.getLignes().stream().noneMatch(l -> "FRAIS_SERVICE".equals(l.code())));
    }
}
