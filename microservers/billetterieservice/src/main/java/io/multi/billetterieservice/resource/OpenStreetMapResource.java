package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.OK;

/**
 * Proxy pour les appels à OpenStreetMap Nominatim API.
 * 100% gratuit, pas de clé API requise.
 *
 * Documentation: https://nominatim.org/release-docs/develop/api/Overview/
 */
@RestController
@RequestMapping("/billetterie/osm")
@RequiredArgsConstructor
@Slf4j
public class OpenStreetMapResource {

    private final RestTemplate restTemplate;

    // URLs Nominatim (API gratuite d'OpenStreetMap)
    private static final String NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
    private static final String NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

    // User-Agent obligatoire pour Nominatim
    private static final String USER_AGENT = "BilletterieGuinee/1.0 (contact@billetterie.gn)";

    /**
     * Recherche d'adresses (Autocomplete)
     * GET /billetterie/osm/search?query=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<Response> search(
            @RequestParam("query") String query,
            @RequestParam(value = "country", defaultValue = "gn") String countryCode,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            HttpServletRequest httpRequest) {

        log.info("GET /billetterie/osm/search - Query: '{}', Country: '{}'", query, countryCode);

        try {
            // Construction de l'URL Nominatim
            String url = String.format(
                    "%s?q=%s&countrycodes=%s&format=json&addressdetails=1&limit=%d",
                    NOMINATIM_SEARCH_URL,
                    query,
                    countryCode,
                    limit
            );

            log.debug("Appel Nominatim: {}", url);

            // Headers obligatoires pour Nominatim
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept-Language", "fr");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, List.class
            );

            List<Map<String, Object>> results = response.getBody();
            log.info("Nominatim a retourné {} résultats", results != null ? results.size() : 0);

            List<Map<String, Object>> predictions = new ArrayList<>();

            if (results != null && !results.isEmpty()) {
                for (Map<String, Object> result : results) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("placeId", String.valueOf(result.get("place_id")));
                    item.put("osmId", String.valueOf(result.get("osm_id")));
                    item.put("osmType", result.get("osm_type"));
                    item.put("description", result.get("display_name"));
                    item.put("latitude", parseDouble(result.get("lat")));
                    item.put("longitude", parseDouble(result.get("lon")));
                    item.put("type", result.get("type"));
                    item.put("category", result.get("class"));

                    // Détails de l'adresse
                    if (result.containsKey("address")) {
                        item.put("address", result.get("address"));
                    }

                    predictions.add(item);
                    log.debug("Résultat: {}", result.get("display_name"));
                }
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of(
                            "predictions", predictions,
                            "total", predictions.size(),
                            "source", "OpenStreetMap/Nominatim"
                    ), "Recherche effectuée avec succès", OK)
            );

        } catch (Exception e) {
            log.error("Erreur Nominatim Search: {}", e.getMessage(), e);
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of(
                            "predictions", List.of(),
                            "total", 0,
                            "error", e.getMessage()
                    ), "Erreur lors de la recherche", OK)
            );
        }
    }

    /**
     * Détails d'un lieu par coordonnées (Reverse Geocoding)
     * GET /billetterie/osm/reverse?lat=xxx&lng=xxx
     */
    @GetMapping("/reverse")
    public ResponseEntity<Response> reverse(
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            HttpServletRequest httpRequest) {

        log.info("GET /billetterie/osm/reverse - Lat: {}, Lng: {}", latitude, longitude);

        try {
            String url = String.format(
                    "%s?lat=%s&lon=%s&format=json&addressdetails=1",
                    NOMINATIM_REVERSE_URL,
                    latitude,
                    longitude
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept-Language", "fr");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Map.class
            );

            Map<String, Object> result = response.getBody();
            log.info("Nominatim Reverse: {}", result);

            Map<String, Object> place = new HashMap<>();

            if (result != null && result.containsKey("display_name")) {
                place.put("address", result.get("display_name"));
                place.put("placeId", String.valueOf(result.get("place_id")));
                place.put("osmId", String.valueOf(result.get("osm_id")));
                place.put("osmType", result.get("osm_type"));
                place.put("latitude", parseDouble(result.get("lat")));
                place.put("longitude", parseDouble(result.get("lon")));

                if (result.containsKey("address")) {
                    place.put("addressDetails", result.get("address"));
                }
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("place", place),
                            "Géocodage inverse effectué avec succès", OK)
            );

        } catch (Exception e) {
            log.error("Erreur Nominatim Reverse: {}", e.getMessage(), e);
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("place", Map.of()),
                            "Erreur lors du géocodage inverse", OK)
            );
        }
    }

    /**
     * Test de l'API Nominatim
     * GET /billetterie/osm/test
     */
    @GetMapping("/test")
    public ResponseEntity<Response> test(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/osm/test - Test de l'API Nominatim");

        try {
            // Test avec Conakry
            String url = String.format(
                    "%s?q=Conakry&countrycodes=gn&format=json&limit=3",
                    NOMINATIM_SEARCH_URL
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept-Language", "fr");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, List.class
            );

            List<Map<String, Object>> results = response.getBody();

            Map<String, Object> testResult = new HashMap<>();
            testResult.put("status", "OK");
            testResult.put("source", "OpenStreetMap/Nominatim");
            testResult.put("resultsCount", results != null ? results.size() : 0);
            testResult.put("results", results);
            testResult.put("message", "API Nominatim fonctionne correctement !");

            return ResponseEntity.ok(
                    getResponse(httpRequest, testResult, "Test réussi", OK)
            );

        } catch (Exception e) {
            log.error("Erreur test Nominatim: {}", e.getMessage(), e);
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of(
                            "status", "ERROR",
                            "error", e.getMessage()
                    ), "Erreur lors du test", OK)
            );
        }
    }

    /**
     * Recherche spécifique en Guinée avec suggestions améliorées
     * GET /billetterie/osm/guinea?query=xxx
     */
    @GetMapping("/guinea")
    public ResponseEntity<Response> searchGuinea(
            @RequestParam("query") String query,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            HttpServletRequest httpRequest) {

        log.info("GET /billetterie/osm/guinea - Query: '{}'", query);

        try {
            // Recherche avec "Guinea" ajouté pour de meilleurs résultats
            String enhancedQuery = query + ", Guinea";

            String url = String.format(
                    "%s?q=%s&countrycodes=gn&format=json&addressdetails=1&limit=%d",
                    NOMINATIM_SEARCH_URL,
                    enhancedQuery,
                    limit
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept-Language", "fr");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, List.class
            );

            List<Map<String, Object>> results = response.getBody();

            List<Map<String, Object>> predictions = new ArrayList<>();

            if (results != null) {
                for (Map<String, Object> result : results) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("placeId", String.valueOf(result.get("place_id")));
                    item.put("description", result.get("display_name"));
                    item.put("latitude", parseDouble(result.get("lat")));
                    item.put("longitude", parseDouble(result.get("lon")));
                    item.put("type", result.get("type"));

                    if (result.containsKey("address")) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> address = (Map<String, Object>) result.get("address");
                        item.put("quartier", address.get("suburb"));
                        item.put("commune", address.get("city_district"));
                        item.put("ville", address.get("city"));
                        item.put("region", address.get("state"));
                    }

                    predictions.add(item);
                }
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of(
                            "predictions", predictions,
                            "total", predictions.size()
                    ), "Recherche Guinée effectuée", OK)
            );

        } catch (Exception e) {
            log.error("Erreur recherche Guinée: {}", e.getMessage(), e);
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of(
                            "predictions", List.of(),
                            "total", 0,
                            "error", e.getMessage()
                    ), "Erreur lors de la recherche", OK)
            );
        }
    }

    private Double parseDouble(Object value) {
        if (value == null) return null;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}