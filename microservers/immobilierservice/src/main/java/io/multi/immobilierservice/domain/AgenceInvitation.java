package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgenceInvitation {

    private Long invitationId;
    private String invitationUuid;
    private String token;
    private Long agenceId;
    private Long inviteUserId;
    private Long inviteParUserId;
    private String bioProposee;
    private String telephonePropose;
    private String statut;              // EN_ATTENTE | ACCEPTEE | REFUSEE | EXPIREE | REVOQUEE
    private String motifRefus;
    private OffsetDateTime dateExpiration;
    private OffsetDateTime dateReponse;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
