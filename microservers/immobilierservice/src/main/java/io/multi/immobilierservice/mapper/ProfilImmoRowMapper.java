package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.ProfilImmo;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class ProfilImmoRowMapper implements RowMapper<ProfilImmo> {

    @Override
    public ProfilImmo mapRow(ResultSet rs, int rowNum) throws SQLException {
        return ProfilImmo.builder()
                .profilId(rs.getLong("profil_id"))
                .profilUuid(rs.getString("profil_uuid"))
                .userId(rs.getLong("user_id"))
                .typeProfil(rs.getString("type_profil"))
                .agenceId(rs.getObject("agence_id", Long.class))
                .statutVerification(rs.getString("statut_verification"))
                .documentsKycUrl(rs.getString("documents_kyc_url"))
                .bio(rs.getString("bio"))
                .telephoneContact(rs.getString("telephone_contact"))
                .noteMoyenne(rs.getBigDecimal("note_moyenne"))
                .nombreAvis(rs.getInt("nombre_avis"))
                .nombreProprietesActives(rs.getInt("nombre_proprietes_actives"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", java.time.OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", java.time.OffsetDateTime.class))
                .build();
    }
}
