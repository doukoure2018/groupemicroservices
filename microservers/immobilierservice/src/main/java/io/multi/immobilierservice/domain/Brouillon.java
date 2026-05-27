package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Brouillon de propriété (wizard 4 étapes).
 *
 * Persiste l'état du formulaire entre les étapes. La conversion finale en
 * {@link Propriete} se fait via {@code POST /immo/brouillons/{uuid}/publier}.
 *
 * Schéma JSON conseillé pour {@code donneesJson} :
 * <pre>
 * {
 *   "etape1": { typeAnnonce, dureeLocation, typeBienCode, publieParProprietaire },
 *   "etape2": { localisationUuid, adresseComplete, latitude, longitude, afficherAdresseExacte },
 *   "etape3": { prix, devise, periode, nombreChambres, nombreSallesBain, surfaceM2,
 *               dateDisponibilite, commoditesCodes, ... },
 *   "etape4": { description, nomContactPublic, telephoneContact }
 * }
 * </pre>
 * Le frontend est libre de la structure, le backend ne valide que le contenu
 * au moment de la publication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Brouillon {

    private Long brouillonId;
    private String brouillonUuid;
    private Long userId;
    private Map<String, Object> donneesJson;
    private Integer etapeActuelle;
    private Long proprieteId;
    private OffsetDateTime derniereModification;
    private OffsetDateTime createdAt;
}
