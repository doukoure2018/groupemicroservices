package io.multi.billetterieservice.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Compte les tentatives d'un même appelant sur une porte ouverte sans jeton.
 * La consultation d'une réservation demande un numéro et un contact : sans
 * frein, on pourrait les deviner à la chaîne. En mémoire du processus, ce qui
 * suffit ici — le service tourne en un exemplaire, et un redémarrage qui
 * remet les compteurs à zéro reste moins grave qu'une dépendance de plus.
 */
@Component
@Slf4j
public class LimiteurTentatives {

    private static final int TENTATIVES_MAX = 10;
    private static final Duration FENETRE = Duration.ofMinutes(10);
    /** Garde-fou mémoire : au-delà, on repart de zéro plutôt que d'enfler sans fin. */
    private static final int APPELANTS_MAX = 10_000;

    private final Map<String, Deque<Instant>> tentatives = new ConcurrentHashMap<>();

    /** true si l'appelant a encore droit à un essai ; l'essai est alors compté. */
    public boolean autorise(String cle) {
        if (tentatives.size() > APPELANTS_MAX) {
            log.warn("Limiteur de tentatives saturé ({} appelants), remise à zéro", tentatives.size());
            tentatives.clear();
        }
        Instant limite = Instant.now().minus(FENETRE);
        Deque<Instant> horodatages = tentatives.computeIfAbsent(cle, k -> new ArrayDeque<>());
        synchronized (horodatages) {
            while (!horodatages.isEmpty() && horodatages.peekFirst().isBefore(limite)) {
                horodatages.pollFirst();
            }
            if (horodatages.size() >= TENTATIVES_MAX) return false;
            horodatages.addLast(Instant.now());
            return true;
        }
    }
}
