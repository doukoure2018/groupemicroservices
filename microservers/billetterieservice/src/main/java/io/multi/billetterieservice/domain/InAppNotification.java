package io.multi.billetterieservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InAppNotification {
    private Long notificationId;
    private String notificationUuid;
    private Long userId;
    private String typeNotification;
    private String categorie;
    private String titre;
    private String message;
    private Boolean lue;
    private Boolean envoyee;
    private OffsetDateTime dateEnvoi;
    private OffsetDateTime dateLecture;
    private Long referenceId;
    private String referenceType;
    private OffsetDateTime createdAt;
}
