package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Avis;
import io.multi.billetterieservice.query.AvisQuery;
import io.multi.billetterieservice.repository.AvisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Implementation du repository Avis utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class AvisRepositoryImpl implements AvisRepository {

    private final JdbcClient jdbcClient;

    private final RowMapper<Avis> rowMapper = (rs, rowNum) -> Avis.builder()
            .avisId(rs.getLong("avis_id"))
            .avisUuid(rs.getString("avis_uuid"))
            .userId(rs.getLong("user_id"))
            .commandeId(rs.getLong("commande_id"))
            .vehiculeId(rs.getObject("vehicule_id", Long.class))
            .note(rs.getInt("note"))
            .commentaire(rs.getString("commentaire"))
            .reponse(rs.getString("reponse"))
            .dateReponse(rs.getObject("date_reponse", OffsetDateTime.class))
            .visible(rs.getBoolean("visible"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            .userFullName(rs.getString("user_full_name"))
            .build();

    @Override
    public List<Avis> findByOffreUuid(String offreUuid) {
        log.info("Recherche des avis pour l'offre UUID: {}", offreUuid);
        return jdbcClient.sql(AvisQuery.FIND_BY_OFFRE_UUID)
                .param("offreUuid", offreUuid)
                .query(rowMapper)
                .list();
    }
}
