package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Décision admin sur un signalement.
 *
 * <p>3 actions possibles :
 * <ul>
 *   <li>{@code RETIRE} : signalement légitime → la propriété passe en RETIRE
 *       (admin a jugé que le contenu est non conforme)</li>
 *   <li>{@code REJETE} : signalement infondé → propriété intacte, signalement marqué REJETE</li>
 *   <li>{@code LAISSE} : vu et ignoré → propriété intacte, signalement marqué TRAITE</li>
 * </ul>
 *
 * <p>Pas d'auto-bascule SIGNALE à N signalements (décision 10b-β) — toujours
 * humain qui tranche. Justification : seuil = machine à abus pour la concurrence.
 */
@Data
public class TraiterSignalementRequest {

    @NotBlank
    @Pattern(regexp = "RETIRE|REJETE|LAISSE",
            message = "action doit être RETIRE, REJETE ou LAISSE")
    private String action;

    @Size(max = 1000)
    private String notesAdmin;
}
