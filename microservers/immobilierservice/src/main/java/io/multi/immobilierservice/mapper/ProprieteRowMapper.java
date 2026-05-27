package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Propriete;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class ProprieteRowMapper implements RowMapper<Propriete> {

    @Override
    public Propriete mapRow(ResultSet rs, int rowNum) throws SQLException {
        BigDecimal lat = rs.getBigDecimal("latitude");
        BigDecimal lng = rs.getBigDecimal("longitude");
        // distance_m est présente dans la requête de recherche, absente ailleurs
        Double distanceM = hasColumn(rs, "distance_m") ? rs.getObject("distance_m", Double.class) : null;
        return Propriete.builder()
                .proprieteId(rs.getLong("propriete_id"))
                .proprieteUuid(rs.getString("propriete_uuid"))
                .reference(rs.getString("reference"))
                .profilId(rs.getLong("profil_id"))
                .agenceId(rs.getObject("agence_id", Long.class))
                .typeAnnonce(rs.getString("type_annonce"))
                .dureeLocation(rs.getString("duree_location"))
                .typeBienId(rs.getLong("type_bien_id"))
                .titre(rs.getString("titre"))
                .description(rs.getString("description"))
                .prix(rs.getBigDecimal("prix"))
                .devise(rs.getString("devise"))
                .periode(rs.getString("periode"))
                .prixSurDemande(rs.getBoolean("prix_sur_demande"))
                .prixNegociable(rs.getBoolean("prix_negociable"))
                .nombreChambres(rs.getObject("nombre_chambres", Integer.class))
                .nombreSallesBain(rs.getObject("nombre_salles_bain", Integer.class))
                .surfaceM2(rs.getBigDecimal("surface_m2"))
                .nombreEtages(rs.getObject("nombre_etages", Integer.class))
                .etageSituation(rs.getObject("etage_situation", Integer.class))
                .anneeConstruction(rs.getObject("annee_construction", Integer.class))
                .moisCaution(rs.getObject("mois_caution", Integer.class))
                .moisAvance(rs.getObject("mois_avance", Integer.class))
                .moisHonoraire(rs.getObject("mois_honoraire", Integer.class))
                .localisationId(rs.getObject("localisation_id", Long.class))
                .adresseComplete(rs.getString("adresse_complete"))
                .latitude(lat != null ? lat.doubleValue() : null)
                .longitude(lng != null ? lng.doubleValue() : null)
                .afficherAdresseExacte(rs.getBoolean("afficher_adresse_exacte"))
                .dateDisponibilite(rs.getDate("date_disponibilite") != null
                        ? rs.getDate("date_disponibilite").toLocalDate() : null)
                .statut(rs.getString("statut"))
                .datePublication(rs.getObject("date_publication", OffsetDateTime.class))
                .dateExpiration(rs.getObject("date_expiration", OffsetDateTime.class))
                .nombreRenouvellements(rs.getInt("nombre_renouvellements"))
                .motifRejet(rs.getString("motif_rejet"))
                .nomContactPublic(rs.getString("nom_contact_public"))
                .telephoneContact(rs.getString("telephone_contact"))
                .nombreVues(rs.getInt("nombre_vues"))
                .nombreFavoris(rs.getInt("nombre_favoris"))
                .nombreContacts(rs.getInt("nombre_contacts"))
                .premium(rs.getBoolean("premium"))
                .datePremiumFin(rs.getObject("date_premium_fin", OffsetDateTime.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .distanceM(distanceM)
                .build();
    }

    private static boolean hasColumn(ResultSet rs, String colName) {
        try {
            rs.findColumn(colName);
            return true;
        } catch (SQLException e) {
            return false;
        }
    }
}
