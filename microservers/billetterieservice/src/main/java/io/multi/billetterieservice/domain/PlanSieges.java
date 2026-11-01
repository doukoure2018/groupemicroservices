package io.multi.billetterieservice.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * Le plan d'un véhicule tel que les clients le dessinent : une grille de
 * rangées, chaque rangée ayant exactement {@code colonnes} cases. La rangée 0
 * est celle du chauffeur. La même forme sert au plan généré et au plan
 * JSON qu'un véhicule peut porter.
 */
public record PlanSieges(String gabarit, int colonnes, List<RangeeSieges> rangees) {

    public static final String BUS = "BUS";
    public static final String MINIBUS = "MINIBUS";
    public static final String VOITURE = "VOITURE";

    /** Les numéros de sièges, dans l'ordre de lecture (rangée par rangée, de gauche à droite). */
    public List<String> numerosSieges() {
        List<String> numeros = new ArrayList<>();
        for (RangeeSieges r : rangees) {
            for (CaseSiege c : r.cases()) {
                if (c.estSiege()) numeros.add(c.numero());
            }
        }
        return numeros;
    }

    public record RangeeSieges(int numero, List<CaseSiege> cases) {
        /** Numéros des sièges de cette rangée, dans l'ordre. */
        public List<String> sieges() {
            return cases.stream().filter(CaseSiege::estSiege).map(CaseSiege::numero).toList();
        }
    }

    /** type : SIEGE (avec numéro), ALLEE, VIDE ou CHAUFFEUR. */
    public record CaseSiege(String type, String numero) {
        public static CaseSiege siege(String numero) { return new CaseSiege("SIEGE", numero); }
        public static CaseSiege allee() { return new CaseSiege("ALLEE", null); }
        public static CaseSiege vide() { return new CaseSiege("VIDE", null); }
        public static CaseSiege chauffeur() { return new CaseSiege("CHAUFFEUR", null); }
        public boolean estSiege() { return "SIEGE".equals(type) && numero != null; }
    }
}
