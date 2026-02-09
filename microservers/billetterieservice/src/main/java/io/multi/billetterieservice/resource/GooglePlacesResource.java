package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Response;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
 * Proxy pour les appels à Google Places API.
 * Résout les problèmes CORS en faisant les appels côté serveur.
 */
@RestController
@RequestMapping("/billetterie/google-places")
@RequiredArgsConstructor
@Slf4j
public class GooglePlacesResource {

    @Value("${google.api.key:AIzaSyAakQpxJmLcDXh8aKdMzt1kZCoNCQgKrLU}")
    private String googleApiKey;

    private final RestTemplate restTemplate;

    private static final String AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/queryautocomplete/json";
    private static final String PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
    private static final String GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

    /**
     * Test de la clé API
     * GET /billetterie/google-places/test
     */
    @GetMapping("/test")
    public ResponseEntity<Response> testApiKey(HttpServletRequest httpRequest) {
        log.info("GET /billetterie/google-places/test - Test de la clé API");

        try {
            // Test simple avec une requête basique (Paris, France - résultats garantis)
            String url = String.format("%s?key=%s&input=Paris&components=country:fr",
                    AUTOCOMPLETE_URL, googleApiKey);

            @SuppressWarnings("unchecked")
            Map<String, Object> googleResponse = restTemplate.getForObject(url, Map.class);

            log.info("Test API - Réponse complète: {}", googleResponse);

            Map<String, Object> result = new HashMap<>();
            result.put("keyPrefix", googleApiKey.substring(0, 10) + "...");
            result.put("fullResponse", googleResponse);

            if (googleResponse != null) {
                result.put("status", googleResponse.get("status"));
                if (googleResponse.containsKey("error_message")) {
                    result.put("errorMessage", googleResponse.get("error_message"));
                }
                if (googleResponse.containsKey("predictions")) {
                    @SuppressWarnings("unchecked")
                    List<?> predictions = (List<?>) googleResponse.get("predictions");
                    result.put("predictionsCount", predictions != null ? predictions.size() : 0);
                }
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, result, "Test effectué", OK)
            );

        } catch (Exception e) {
            log.error("Erreur test API: {}", e.getMessage(), e);
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("error", e.getMessage(), "errorType", e.getClass().getSimpleName()),
                            "Erreur lors du test", OK)
            );
        }
    }

    /**
     * Autocomplete - Suggestions d'adresses
     * GET /billetterie/google-places/autocomplete?query=xxx
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<Response> autocomplete(
            @RequestParam("query") String query,
            @RequestParam(value = "country", defaultValue = "gn") String country,
            HttpServletRequest httpRequest) {

        log.info("GET /billetterie/google-places/autocomplete - Query: '{}', Country: '{}'", query, country);

        try {
            String url = String.format("%s?key=%s&input=%s&components=country:%s",
                    AUTOCOMPLETE_URL, googleApiKey, query, country);

            log.info("URL appelée: {}", url.replace(googleApiKey, "***"));

            @SuppressWarnings("unchecked")
            Map<String, Object> googleResponse = restTemplate.getForObject(url, Map.class);

            // LOG DÉTAILLÉ DE LA RÉPONSE GOOGLE
            log.info("Réponse Google COMPLÈTE: {}", googleResponse);

            List<Map<String, String>> predictions = new ArrayList<>();
            String googleStatus = "NO_RESPONSE";
            String errorMessage = null;

            if (googleResponse != null) {
                googleStatus = (String) googleResponse.get("status");
                log.info("Google API Status: {}", googleStatus);

                // Vérifier les messages d'erreur
                if (googleResponse.containsKey("error_message")) {
                    errorMessage = (String) googleResponse.get("error_message");
                    log.error("Google API Error Message: {}", errorMessage);
                }

                if ("OK".equals(googleStatus)) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> googlePredictions =
                            (List<Map<String, Object>>) googleResponse.get("predictions");

                    if (googlePredictions != null) {
                        log.info("Nombre de prédictions trouvées: {}", googlePredictions.size());
                        for (Map<String, Object> prediction : googlePredictions) {
                            Map<String, String> item = new HashMap<>();
                            item.put("description", (String) prediction.get("description"));
                            item.put("placeId", (String) prediction.get("place_id"));
                            predictions.add(item);
                            log.debug("Prédiction: {}", prediction.get("description"));
                        }
                    }
                } else if ("ZERO_RESULTS".equals(googleStatus)) {
                    log.warn("Google n'a trouvé aucun résultat pour '{}' dans le pays '{}'", query, country);
                } else if ("REQUEST_DENIED".equals(googleStatus)) {
                    log.error("REQUEST_DENIED - Clé API invalide ou API non activée. Message: {}", errorMessage);
                } else if ("OVER_QUERY_LIMIT".equals(googleStatus)) {
                    log.error("OVER_QUERY_LIMIT - Quota Google dépassé");
                } else if ("INVALID_REQUEST".equals(googleStatus)) {
                    log.error("INVALID_REQUEST - Paramètres invalides");
                }
            }

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("predictions", predictions);
            responseData.put("total", predictions.size());
            responseData.put("googleStatus", googleStatus);
            if (errorMessage != null) {
                responseData.put("googleError", errorMessage);
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, responseData, "Suggestions récupérées avec succès", OK)
            );

        } catch (Exception e) {
            log.error("Exception lors de l'appel Google: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of(
                                    "predictions", List.of(),
                                    "total", 0,
                                    "error", e.getMessage(),
                                    "errorType", e.getClass().getSimpleName()
                            ),
                            "Erreur lors de la récupération des suggestions", OK)
            );
        }
    }

    /**
     * Place Details - Récupère les détails d'un lieu (adresse, coordonnées)
     * GET /billetterie/google-places/details?placeId=xxx
     */
    @GetMapping("/details")
    public ResponseEntity<Response> placeDetails(
            @RequestParam("placeId") String placeId,
            HttpServletRequest httpRequest) {

        log.info("GET /billetterie/google-places/details - PlaceId: {}", placeId);

        try {
            String url = String.format("%s?key=%s&placeid=%s&fields=formatted_address,geometry",
                    PLACE_DETAILS_URL, googleApiKey, placeId);

            @SuppressWarnings("unchecked")
            Map<String, Object> googleResponse = restTemplate.getForObject(url, Map.class);

            log.info("Place Details - Réponse Google: {}", googleResponse);

            Map<String, Object> placeDetails = new HashMap<>();

            if (googleResponse != null && "OK".equals(googleResponse.get("status"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = (Map<String, Object>) googleResponse.get("result");

                if (result != null) {
                    placeDetails.put("address", result.get("formatted_address"));

                    @SuppressWarnings("unchecked")
                    Map<String, Object> geometry = (Map<String, Object>) result.get("geometry");
                    if (geometry != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> location = (Map<String, Object>) geometry.get("location");
                        if (location != null) {
                            placeDetails.put("latitude", location.get("lat"));
                            placeDetails.put("longitude", location.get("lng"));
                        }
                    }
                }
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("place", placeDetails),
                            "Détails du lieu récupérés avec succès", OK)
            );

        } catch (Exception e) {
            log.error("Erreur Google Place Details: {}", e.getMessage());
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("place", Map.of()),
                            "Erreur lors de la récupération des détails", OK)
            );
        }
    }

    /**
     * Reverse Geocoding - Récupère l'adresse à partir de coordonnées
     * GET /billetterie/google-places/geocode?lat=xxx&lng=xxx
     */
    @GetMapping("/geocode")
    public ResponseEntity<Response> reverseGeocode(
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            HttpServletRequest httpRequest) {

        log.info("GET /billetterie/google-places/geocode - Lat: {}, Lng: {}", latitude, longitude);

        try {
            String url = String.format("%s?key=%s&latlng=%s,%s",
                    GEOCODE_URL, googleApiKey, latitude, longitude);

            @SuppressWarnings("unchecked")
            Map<String, Object> googleResponse = restTemplate.getForObject(url, Map.class);

            log.info("Geocode - Réponse Google: {}", googleResponse);

            String address = null;

            if (googleResponse != null && "OK".equals(googleResponse.get("status"))) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> results =
                        (List<Map<String, Object>>) googleResponse.get("results");

                if (results != null && !results.isEmpty()) {
                    address = (String) results.get(0).get("formatted_address");
                }
            }

            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("address", address != null ? address : ""),
                            "Adresse récupérée avec succès", OK)
            );

        } catch (Exception e) {
            log.error("Erreur Google Geocoding: {}", e.getMessage());
            return ResponseEntity.ok(
                    getResponse(httpRequest, Map.of("address", ""),
                            "Erreur lors de la récupération de l'adresse", OK)
            );
        }
    }
}