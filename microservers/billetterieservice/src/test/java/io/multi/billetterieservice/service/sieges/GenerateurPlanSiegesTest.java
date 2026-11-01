package io.multi.billetterieservice.service.sieges;

import io.multi.billetterieservice.domain.PlanSieges;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class GenerateurPlanSiegesTest {

    private final GenerateurPlanSieges generateur = new GenerateurPlanSieges();

    private static void verifierGrille(PlanSieges plan, int places) {
        List<String> numeros = plan.numerosSieges();
        assertEquals(places, numeros.size(), "autant de sièges que de places");
        assertEquals(places, new HashSet<>(numeros).size(), "numéros uniques");
        assertEquals("1", numeros.get(0));
        assertEquals(String.valueOf(places), numeros.get(places - 1));
        for (PlanSieges.RangeeSieges r : plan.rangees()) {
            assertEquals(plan.colonnes(), r.cases().size(), "chaque rangée a toutes ses colonnes");
        }
        assertEquals("CHAUFFEUR", plan.rangees().get(0).cases().get(0).type());
    }

    @Test
    void busDe50EtBanquetteDuFond() {
        PlanSieges plan = generateur.generer("BUS", 49);
        verifierGrille(plan, 49);
        PlanSieges.RangeeSieges fond = plan.rangees().get(plan.rangees().size() - 1);
        assertEquals(5, fond.sieges().size(), "49 = 11 × 4 + banquette de 5");
        verifierGrille(generateur.generer("BUS", 50), 50);
        verifierGrille(generateur.generer("bus", 18), 18);
    }

    @Test
    void minibusAvecUnPassagerDevant() {
        PlanSieges plan = generateur.generer("MINIBUS", 18);
        verifierGrille(plan, 18);
        assertEquals(List.of("1"), plan.rangees().get(0).sieges());
        assertEquals(4, plan.colonnes());
    }

    @Test
    void voitureTroisParRang() {
        PlanSieges plan = generateur.generer("VOITURE", 7);
        verifierGrille(plan, 7);
        assertEquals(3, plan.colonnes());
        assertEquals(List.of("2", "3", "4"), plan.rangees().get(1).sieges());
    }

    @Test
    void gabaritInconnuOuAbsentVautBus() {
        assertEquals("BUS", generateur.generer(null, 10).gabarit());
        assertEquals("BUS", generateur.generer("CAMION", 10).gabarit());
    }

    @Test
    void attributionAutomatiqueCoteACote() {
        PlanSieges plan = generateur.generer("BUS", 20);
        Set<String> pris = Set.of("1", "3");
        assertEquals(List.of("5", "6"), SiegesService.premiersLibres(plan, pris, 2), "2 et 4 ne sont pas voisins : rangée suivante");
        assertEquals(List.of("2"), SiegesService.premiersLibres(plan, pris, 1));
        assertEquals(List.of("2", "4", "5"), SiegesService.premiersLibres(plan, Set.of("1", "3", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"), 3), "plus de bloc contigu : les premiers libres");
    }
}
