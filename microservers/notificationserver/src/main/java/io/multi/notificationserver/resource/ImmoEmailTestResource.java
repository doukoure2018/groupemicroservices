package io.multi.notificationserver.resource;

import io.multi.notificationserver.event.immo.ImmoEventType;
import io.multi.notificationserver.service.ImmoEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoint dev-only pour vérifier qu'un template Thymeleaf immo s'affiche
 * correctement avec un payload donné. Garde {@code @Profile("dev")} pour
 * éviter d'exposer le rendu en prod (info leakage potentielle).
 *
 * <p>Usage : {@code POST /notification/test-render/immo/IMMO_CONTACT_RECU}
 * avec body JSON = payload data. Retourne le HTML rendu.
 *
 * <p>Pourquoi ? Le pattern test-de-rendu :
 * <ul>
 *   <li>détecte les variables manquantes dans un template (sinon erreur runtime
 *       silencieuse au consume Kafka),</li>
 *   <li>permet de vérifier visuellement le rendu (CSS, layout, conditionnels),</li>
 *   <li>évite d'envoyer des vrais mails pendant le dev itératif.</li>
 * </ul>
 */
@RestController
@RequestMapping("/notification/test-render/immo")
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class ImmoEmailTestResource {

    private final ImmoEmailService immoEmailService;

    @PostMapping(value = "/{eventType}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> render(@PathVariable("eventType") String eventType,
                                          @RequestBody Map<String, Object> data) {
        ImmoEventType type;
        try {
            type = ImmoEventType.valueOf(eventType);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("EventType inconnu : " + eventType);
        }
        String html = immoEmailService.renderPreview(type, data);
        log.info("Rendu preview {} ({} chars)", type, html.length());
        return ResponseEntity.ok(html);
    }
}
