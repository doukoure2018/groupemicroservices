package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.mapper.AgenceRowMapper;
import io.multi.immobilierservice.query.AgenceQuery;
import io.multi.immobilierservice.repository.AgenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Slf4j
public class AgenceRepositoryImpl implements AgenceRepository {

    private final JdbcClient jdbcClient;
    private final AgenceRowMapper rowMapper;

    @Override
    public Agence save(Agence agence) {
        log.debug("Création agence: {}", agence.getNom());
        return jdbcClient.sql(AgenceQuery.INSERT_AGENCE)
                .param("nom", agence.getNom())
                .param("raisonSociale", agence.getRaisonSociale())
                .param("numeroRegistre", agence.getNumeroRegistre())
                .param("logoUrl", agence.getLogoUrl())
                .param("telephone", agence.getTelephone())
                .param("email", agence.getEmail())
                .param("localisationId", agence.getLocalisationId())
                .param("description", agence.getDescription())
                .param("siteWeb", agence.getSiteWeb())
                .param("reseauxSociauxJson", agence.getReseauxSociauxJson())
                .param("proprietaireUserId", agence.getProprietaireUserId())
                .param("documentsKycUrl", agence.getDocumentsKycUrl())
                .param("dateCreationAgence", agence.getDateCreationAgence())
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<Agence> update(Agence agence) {
        log.debug("Mise à jour agence UUID={}", agence.getAgenceUuid());
        return jdbcClient.sql(AgenceQuery.UPDATE_AGENCE)
                .param("agenceUuid", agence.getAgenceUuid())
                .param("nom", agence.getNom())
                .param("raisonSociale", agence.getRaisonSociale())
                .param("numeroRegistre", agence.getNumeroRegistre())
                .param("logoUrl", agence.getLogoUrl())
                .param("telephone", agence.getTelephone())
                .param("email", agence.getEmail())
                .param("localisationId", agence.getLocalisationId())
                .param("description", agence.getDescription())
                .param("siteWeb", agence.getSiteWeb())
                .param("reseauxSociauxJson", agence.getReseauxSociauxJson())
                .param("documentsKycUrl", agence.getDocumentsKycUrl())
                .param("dateCreationAgence", agence.getDateCreationAgence())
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Agence> updateStatutVerification(String agenceUuid, String statut) {
        return jdbcClient.sql(AgenceQuery.UPDATE_STATUT_VERIFICATION)
                .param("agenceUuid", agenceUuid)
                .param("statut", statut)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Agence> findByUuid(String agenceUuid) {
        return jdbcClient.sql(AgenceQuery.FIND_BY_UUID)
                .param("agenceUuid", agenceUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Agence> findById(Long agenceId) {
        return jdbcClient.sql(AgenceQuery.FIND_BY_ID)
                .param("agenceId", agenceId)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Agence> findAll(int limit, int offset) {
        return jdbcClient.sql(AgenceQuery.FIND_ALL)
                .param("limit", limit)
                .param("offset", offset)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Agence> findByProprietaire(Long userId) {
        return jdbcClient.sql(AgenceQuery.FIND_BY_PROPRIETAIRE)
                .param("userId", userId)
                .query(rowMapper)
                .list();
    }

    @Override
    public void softDelete(String agenceUuid) {
        jdbcClient.sql(AgenceQuery.DELETE_AGENCE)
                .param("agenceUuid", agenceUuid)
                .update();
    }

    @Override
    public long count() {
        return jdbcClient.sql(AgenceQuery.COUNT_ALL)
                .query(Long.class)
                .single();
    }
}
