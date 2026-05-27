package io.multi.immobilierservice.dto;

import io.multi.immobilierservice.domain.Propriete;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResult {
    private List<Propriete> proprietes;
    private long total;             // total filtré (avant pagination)
    private int limit;
    private int offset;
    private String tri;             // tri effectif appliqué
}
