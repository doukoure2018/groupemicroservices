package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Décision back-office sur un lead contact/visite (intermédiation Phase 1).
 *
 * <ul>
 *   <li>{@code TRAITE} : lead pris en charge / relayé au propriétaire.</li>
 *   <li>{@code REJETE} : lead écarté (spam, hors sujet…).</li>
 * </ul>
 */
@Data
public class TraiterLeadRequest {

    @NotBlank
    @Pattern(regexp = "TRAITE|REJETE", message = "action doit être TRAITE ou REJETE")
    private String action;

    @Size(max = 1000)
    private String noteAdmin;
}
