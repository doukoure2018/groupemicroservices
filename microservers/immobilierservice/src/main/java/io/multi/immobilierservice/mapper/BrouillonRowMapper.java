package io.multi.immobilierservice.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.immobilierservice.domain.Brouillon;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class BrouillonRowMapper implements RowMapper<Brouillon> {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    @Override
    public Brouillon mapRow(ResultSet rs, int rowNum) throws SQLException {
        Map<String, Object> donnees = parseJsonb(rs.getString("donnees_json"));
        return Brouillon.builder()
                .brouillonId(rs.getLong("brouillon_id"))
                .brouillonUuid(rs.getString("brouillon_uuid"))
                .userId(rs.getLong("user_id"))
                .donneesJson(donnees)
                .etapeActuelle(rs.getInt("etape_actuelle"))
                .proprieteId(rs.getObject("propriete_id", Long.class))
                .derniereModification(rs.getObject("derniere_modification", OffsetDateTime.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }

    private Map<String, Object> parseJsonb(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (Exception e) {
            log.warn("Lecture JSONB brouillon échouée : {}", e.getMessage());
            return Map.of();
        }
    }
}
