package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Audit log d'une action admin de modération. Cf table {@code immo_admin_action}
 * et dette {@code audit-log-moderation-admin} fermée par ce commit.
 *
 * <p>Enum {@code action} MVP : {@code VALIDER} | {@code REJETER}. Étendre quand
 * de nouvelles actions admin sont codées (ex : SUPPRIMER, EDITER).
 *
 * <p>Règle : {@code motif} est NULL pour VALIDER et requis ≥15 chars pour
 * REJETER. Cette règle est reproduite côté BD via CHECK constraint
 * ({@code chk_motif_business_rule}) pour defense in depth.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAction {

    private Long actionId;
    private String actionUuid;
    private Long adminUserId;
    private String proprieteUuid;
    private String action;       // VALIDER | REJETER
    private String motif;        // NULL si VALIDER
    private OffsetDateTime createdAt;
}
