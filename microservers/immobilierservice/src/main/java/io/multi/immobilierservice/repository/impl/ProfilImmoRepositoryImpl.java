package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.mapper.ProfilImmoRowMapper;
import io.multi.immobilierservice.query.ProfilImmoQuery;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Slf4j
public class ProfilImmoRepositoryImpl implements ProfilImmoRepository {

    private final JdbcClient jdbcClient;
    private final ProfilImmoRowMapper rowMapper;

    @Override
    public ProfilImmo save(ProfilImmo profil) {
        log.debug("Création profil immo userId={} type={}", profil.getUserId(), profil.getTypeProfil());
        return jdbcClient.sql(ProfilImmoQuery.INSERT_PROFIL)
                .param("userId", profil.getUserId())
                .param("typeProfil", profil.getTypeProfil())
                .param("agenceId", profil.getAgenceId())
                .param("documentsKycUrl", profil.getDocumentsKycUrl())
                .param("bio", profil.getBio())
                .param("telephoneContact", profil.getTelephoneContact())
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<ProfilImmo> update(ProfilImmo profil) {
        return jdbcClient.sql(ProfilImmoQuery.UPDATE_PROFIL)
                .param("profilUuid", profil.getProfilUuid())
                .param("bio", profil.getBio())
                .param("telephoneContact", profil.getTelephoneContact())
                .param("documentsKycUrl", profil.getDocumentsKycUrl())
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ProfilImmo> updateStatutVerification(String profilUuid, String statut) {
        return jdbcClient.sql(ProfilImmoQuery.UPDATE_STATUT_VERIFICATION)
                .param("profilUuid", profilUuid)
                .param("statut", statut)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ProfilImmo> findByUuid(String profilUuid) {
        return jdbcClient.sql(ProfilImmoQuery.FIND_BY_UUID)
                .param("profilUuid", profilUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ProfilImmo> findByUserId(Long userId) {
        return jdbcClient.sql(ProfilImmoQuery.FIND_BY_USER_ID)
                .param("userId", userId)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ProfilImmo> findById(Long profilId) {
        return jdbcClient.sql("SELECT * FROM immo_profil WHERE profil_id = :profilId")
                .param("profilId", profilId)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<ProfilImmo> findByAgence(Long agenceId) {
        return jdbcClient.sql(ProfilImmoQuery.FIND_BY_AGENCE)
                .param("agenceId", agenceId)
                .query(rowMapper)
                .list();
    }

    @Override
    public void softDelete(String profilUuid) {
        jdbcClient.sql(ProfilImmoQuery.DELETE_PROFIL)
                .param("profilUuid", profilUuid)
                .update();
    }

    @Override
    public void incrementNombreProprietesActives(Long profilId) {
        jdbcClient.sql(ProfilImmoQuery.INCREMENT_PROPRIETES_ACTIVES)
                .param("profilId", profilId)
                .update();
    }

    @Override
    public void decrementNombreProprietesActives(Long profilId) {
        jdbcClient.sql(ProfilImmoQuery.DECREMENT_PROPRIETES_ACTIVES)
                .param("profilId", profilId)
                .update();
    }
}
