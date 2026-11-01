package io.multi.billetterieservice.service.sieges;

import io.multi.billetterieservice.domain.PlanSieges;
import io.multi.billetterieservice.domain.PlanSieges.CaseSiege;
import io.multi.billetterieservice.domain.PlanSieges.RangeeSieges;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Trois gabarits suffisent à la flotte : le bus (2 + 2 autour d'une allée,
 * banquette de cinq au fond quand il en reste cinq), le minibus (2 + 1, un
 * passager à côté du chauffeur), et la voiture — 4x4, taxi-brousse — (un
 * passager devant, puis trois par rang). Les sièges se numérotent de 1 à n
 * dans l'ordre de lecture. Un véhicule qui ne ressemble à rien de tout cela
 * porte son propre plan JSON, même forme.
 */
@Component
public class GenerateurPlanSieges {

    public PlanSieges generer(String gabarit, int nombrePlaces) {
        int n = Math.max(0, nombrePlaces);
        return switch (gabarit == null ? PlanSieges.BUS : gabarit.trim().toUpperCase()) {
            case PlanSieges.MINIBUS -> minibus(n);
            case PlanSieges.VOITURE -> voiture(n);
            default -> bus(n);
        };
    }

    /** Colonnes : S S | S S. Rangée 0 : chauffeur à gauche. */
    private PlanSieges bus(int n) {
        List<RangeeSieges> rangees = new ArrayList<>();
        rangees.add(new RangeeSieges(0, List.of(CaseSiege.chauffeur(), CaseSiege.vide(), CaseSiege.allee(), CaseSiege.vide(), CaseSiege.vide())));
        int[] suivant = {1};
        int rang = 1;
        while (suivant[0] <= n) {
            int restant = n - suivant[0] + 1;
            if (restant == 5) {
                rangees.add(new RangeeSieges(rang, List.of(siege(suivant), siege(suivant), siege(suivant), siege(suivant), siege(suivant))));
            } else {
                rangees.add(new RangeeSieges(rang, List.of(siegeOuVide(suivant, n), siegeOuVide(suivant, n), CaseSiege.allee(), siegeOuVide(suivant, n), siegeOuVide(suivant, n))));
            }
            rang++;
        }
        return new PlanSieges(PlanSieges.BUS, 5, rangees);
    }

    /** Colonnes : S S | S. Rangée 0 : chauffeur à gauche, un passager à droite de l'allée. */
    private PlanSieges minibus(int n) {
        List<RangeeSieges> rangees = new ArrayList<>();
        int[] suivant = {1};
        rangees.add(new RangeeSieges(0, List.of(CaseSiege.chauffeur(), CaseSiege.vide(), CaseSiege.allee(), siegeOuVide(suivant, n))));
        int rang = 1;
        while (suivant[0] <= n) {
            int restant = n - suivant[0] + 1;
            if (restant == 4) {
                rangees.add(new RangeeSieges(rang, List.of(siege(suivant), siege(suivant), siege(suivant), siege(suivant))));
            } else {
                rangees.add(new RangeeSieges(rang, List.of(siegeOuVide(suivant, n), siegeOuVide(suivant, n), CaseSiege.allee(), siegeOuVide(suivant, n))));
            }
            rang++;
        }
        return new PlanSieges(PlanSieges.MINIBUS, 4, rangees);
    }

    /** Colonnes : S S S. Rangée 0 : chauffeur à gauche, un passager à droite. */
    private PlanSieges voiture(int n) {
        List<RangeeSieges> rangees = new ArrayList<>();
        int[] suivant = {1};
        rangees.add(new RangeeSieges(0, List.of(CaseSiege.chauffeur(), CaseSiege.vide(), siegeOuVide(suivant, n))));
        int rang = 1;
        while (suivant[0] <= n) {
            rangees.add(new RangeeSieges(rang, List.of(siegeOuVide(suivant, n), siegeOuVide(suivant, n), siegeOuVide(suivant, n))));
            rang++;
        }
        return new PlanSieges(PlanSieges.VOITURE, 3, rangees);
    }

    private static CaseSiege siege(int[] suivant) {
        return CaseSiege.siege(String.valueOf(suivant[0]++));
    }

    private static CaseSiege siegeOuVide(int[] suivant, int n) {
        return suivant[0] <= n ? siege(suivant) : CaseSiege.vide();
    }
}
