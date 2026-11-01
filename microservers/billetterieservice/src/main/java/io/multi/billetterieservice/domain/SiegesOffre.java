package io.multi.billetterieservice.domain;

import java.util.List;

/** Ce que l'écran de choix des sièges reçoit : le plan, les sièges déjà pris, les places encore vendables. */
public record SiegesOffre(PlanSieges plan, List<String> occupes, int placesDisponibles) {
}
