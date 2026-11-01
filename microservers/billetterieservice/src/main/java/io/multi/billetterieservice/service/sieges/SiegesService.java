package io.multi.billetterieservice.service.sieges;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.domain.PlanSieges;
import io.multi.billetterieservice.domain.SiegesOffre;
import io.multi.billetterieservice.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Le plan d'une offre et l'attribution des sièges. Le plan vient du véhicule
 * (JSON) ou du gabarit de son type ; les sièges pris sont ceux des billets
 * non annulés de l'offre, commandes en attente de paiement comprises — elles
 * retiennent leurs places, donc leurs sièges.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SiegesService {

    private static final String SIEGES_OCCUPES = """
        SELECT numero_siege FROM billets
        WHERE offre_id = :offreId AND numero_siege IS NOT NULL AND statut <> 'ANNULE'
        """;

    private final JdbcClient jdbcClient;
    private final ObjectMapper objectMapper;
    private final GenerateurPlanSieges generateur;

    public PlanSieges plan(Offre offre) {
        if (offre.getVehiculePlanSieges() != null && !offre.getVehiculePlanSieges().isBlank()) {
            try {
                PlanSieges plan = objectMapper.readValue(offre.getVehiculePlanSieges(), PlanSieges.class);
                if (plan.rangees() != null && !plan.numerosSieges().isEmpty()) return plan;
                log.warn("Plan de sièges du véhicule {} sans siège, gabarit utilisé", offre.getVehiculeUuid());
            } catch (Exception e) {
                // Un plan illisible ne doit pas empêcher de vendre : on retombe sur le gabarit.
                log.warn("Plan de sièges du véhicule {} illisible ({}), gabarit utilisé", offre.getVehiculeUuid(), e.getMessage());
            }
        }
        int places = offre.getVehiculeNombrePlaces() != null && offre.getVehiculeNombrePlaces() > 0
                ? offre.getVehiculeNombrePlaces()
                : (offre.getNombrePlacesTotal() != null ? offre.getNombrePlacesTotal() : 0);
        return generateur.generer(offre.getTypeVehiculeGabarit(), places);
    }

    public List<String> occupes(Long offreId) {
        return jdbcClient.sql(SIEGES_OCCUPES).param("offreId", offreId).query(String.class).list();
    }

    public SiegesOffre siegesOffre(Offre offre) {
        return new SiegesOffre(plan(offre), occupes(offre.getOffreId()),
                offre.getNombrePlacesDisponibles() != null ? offre.getNombrePlacesDisponibles() : 0);
    }

    /**
     * Un siège par passager. Les sièges choisis sont vérifiés (existent, libres,
     * distincts) ; les passagers sans choix reçoivent les premiers sièges libres,
     * côte à côte dans une même rangée quand c'est possible. La base garde le
     * dernier mot : deux commandes simultanées sur le même siège, la seconde
     * échoue sur l'index unique.
     *
     * @param choisis un numéro par passager, null pour « peu importe »
     */
    public List<String> attribuer(Offre offre, List<String> choisis, int nombre) {
        PlanSieges plan = plan(offre);
        Set<String> existants = new HashSet<>(plan.numerosSieges());
        Set<String> pris = new HashSet<>(occupes(offre.getOffreId()));

        List<String> resultat = new ArrayList<>();
        Set<String> dejaChoisis = new LinkedHashSet<>();
        for (int i = 0; i < nombre; i++) {
            String choix = i < choisis.size() ? choisis.get(i) : null;
            if (choix == null || choix.isBlank()) {
                resultat.add(null);
                continue;
            }
            choix = choix.trim();
            if (!existants.contains(choix)) throw new ApiException("Le siège " + choix + " n'existe pas dans ce véhicule");
            if (pris.contains(choix)) throw new ApiException("Le siège " + choix + " est déjà pris, choisissez-en un autre");
            if (!dejaChoisis.add(choix)) throw new ApiException("Le siège " + choix + " est choisi deux fois");
            resultat.add(choix);
        }

        int manquants = (int) resultat.stream().filter(s -> s == null).count();
        if (manquants > 0) {
            Set<String> indisponibles = new HashSet<>(pris);
            indisponibles.addAll(dejaChoisis);
            List<String> automatiques = premiersLibres(plan, indisponibles, manquants);
            if (automatiques.size() < manquants) {
                throw new ApiException("Il ne reste plus assez de sièges libres pour cette réservation");
            }
            int k = 0;
            for (int i = 0; i < resultat.size(); i++) {
                if (resultat.get(i) == null) resultat.set(i, automatiques.get(k++));
            }
        }
        return resultat;
    }

    /** Un bloc contigu dans une rangée si possible, sinon les premiers libres du plan. */
    static List<String> premiersLibres(PlanSieges plan, Set<String> indisponibles, int nombre) {
        for (PlanSieges.RangeeSieges rangee : plan.rangees()) {
            List<String> sieges = rangee.sieges();
            for (int debut = 0; debut + nombre <= sieges.size(); debut++) {
                List<String> bloc = sieges.subList(debut, debut + nombre);
                if (bloc.stream().noneMatch(indisponibles::contains)) return new ArrayList<>(bloc);
            }
        }
        List<String> libres = new ArrayList<>();
        for (String s : plan.numerosSieges()) {
            if (!indisponibles.contains(s)) libres.add(s);
            if (libres.size() == nombre) break;
        }
        return libres;
    }
}
