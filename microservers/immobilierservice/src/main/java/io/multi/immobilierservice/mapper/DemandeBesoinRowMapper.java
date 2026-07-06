package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.DemandeBesoin;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Mappe le SELECT enrichi de {@link io.multi.immobilierservice.query.DemandeBesoinQuery}
 * (jointures communes/villes/regions/quartiers/type_bien incluses).
 */
@Component
public class DemandeBesoinRowMapper implements RowMapper<DemandeBesoin> {

    @Override
    public DemandeBesoin mapRow(ResultSet rs, int rowNum) throws SQLException {
        return DemandeBesoin.builder()
                .demandeId(rs.getLong("demande_id"))
                .demandeUuid(rs.getString("demande_uuid"))
                .reference(rs.getString("reference"))
                .userId(rs.getLong("user_id"))
                .typeAnnonce(rs.getString("type_annonce"))
                .typeBienId(rs.getObject("type_bien_id", Long.class))
                .communeId(rs.getObject("commune_id", Long.class))
                .quartierId(rs.getObject("quartier_id", Long.class))
                .budgetMin(rs.getBigDecimal("budget_min"))
                .budgetMax(rs.getBigDecimal("budget_max"))
                .devise(rs.getString("devise"))
                .nbChambresMin(rs.getObject("nb_chambres_min", Integer.class))
                .commoditeIdsJson(rs.getString("commodite_ids"))
                .description(rs.getString("description"))
                .contactTelephone(rs.getString("contact_telephone"))
                .contactWhatsapp(rs.getString("contact_whatsapp"))
                .statut(rs.getString("statut"))
                .createdAt(rs.getObject("created_at", java.time.OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", java.time.OffsetDateTime.class))
                .communeLibelle(rs.getString("commune_libelle"))
                .quartierLibelle(rs.getString("quartier_libelle"))
                .typeBienLibelle(rs.getString("type_bien_libelle"))
                .regionId(rs.getObject("region_id_enrichi", Long.class))
                .regionLibelle(rs.getString("region_libelle"))
                .build();
    }
}
