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
public class Region {

    private Long regionId;
    private String regionUuid;
    private String libelle;
    private String code;
    private Boolean actif;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
