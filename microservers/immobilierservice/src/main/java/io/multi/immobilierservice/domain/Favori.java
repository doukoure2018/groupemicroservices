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
public class Favori {

    private Long favoriId;
    private Long userId;
    private Long proprieteId;
    private OffsetDateTime createdAt;
}
