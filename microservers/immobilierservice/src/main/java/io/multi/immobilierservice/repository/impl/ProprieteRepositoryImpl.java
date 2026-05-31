package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ProprieteSearchCriteria;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.mapper.CommoditeRowMapper;
import io.multi.immobilierservice.mapper.ProprieteRowMapper;
import io.multi.immobilierservice.query.ProprieteQuery;
import io.multi.immobilierservice.repository.ProprieteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
@RequiredArgsConstructor
@Slf4j
public class ProprieteRepositoryImpl implements ProprieteRepository {

    private final JdbcClient jdbcClient;
    private final ProprieteRowMapper proprieteRowMapper;
    private final CommoditeRowMapper commoditeRowMapper;

    @Override
    public Propriete save(Propriete p) {
        return jdbcClient.sql(ProprieteQuery.INSERT_PROPRIETE)
                .param("profilId", p.getProfilId())
                .param("agenceId", p.getAgenceId())
                .param("typeAnnonce", p.getTypeAnnonce())
                .param("dureeLocation", p.getDureeLocation())
                .param("typeBienId", p.getTypeBienId())
                .param("titre", p.getTitre())
                .param("description", p.getDescription())
                .param("prix", p.getPrix())
                .param("devise", p.getDevise() != null ? p.getDevise() : "GNF")
                .param("periode", p.getPeriode())
                .param("prixSurDemande", Boolean.TRUE.equals(p.getPrixSurDemande()))
                .param("prixNegociable", Boolean.TRUE.equals(p.getPrixNegociable()))
                .param("nombreChambres", p.getNombreChambres() != null ? p.getNombreChambres() : 0)
                .param("nombreSallesBain", p.getNombreSallesBain() != null ? p.getNombreSallesBain() : 1)
                .param("surfaceM2", p.getSurfaceM2())
                .param("nombreEtages", p.getNombreEtages())
                .param("etageSituation", p.getEtageSituation())
                .param("anneeConstruction", p.getAnneeConstruction())
                .param("moisCaution", p.getMoisCaution())
                .param("moisAvance", p.getMoisAvance())
                .param("moisHonoraire", p.getMoisHonoraire())
                .param("localisationId", p.getLocalisationId())
                .param("adresseComplete", p.getAdresseComplete())
                .param("latitude", p.getLatitude())
                .param("longitude", p.getLongitude())
                .param("afficherAdresseExacte", Boolean.TRUE.equals(p.getAfficherAdresseExacte()))
                .param("dateDisponibilite", p.getDateDisponibilite())
                .param("statut", p.getStatut() != null ? p.getStatut() : "BROUILLON")
                .param("nomContactPublic", p.getNomContactPublic())
                .param("telephoneContact", p.getTelephoneContact())
                .query(proprieteRowMapper)
                .single();
    }

    @Override
    public Optional<Propriete> update(String proprieteUuid, Propriete u) {
        return jdbcClient.sql(ProprieteQuery.UPDATE_PROPRIETE)
                .param("proprieteUuid", proprieteUuid)
                .param("titre", u.getTitre())
                .param("description", u.getDescription())
                .param("dureeLocation", u.getDureeLocation())
                .param("prix", u.getPrix())
                .param("devise", u.getDevise())
                .param("periode", u.getPeriode())
                .param("prixSurDemande", u.getPrixSurDemande())
                .param("prixNegociable", u.getPrixNegociable())
                .param("nombreChambres", u.getNombreChambres())
                .param("nombreSallesBain", u.getNombreSallesBain())
                .param("surfaceM2", u.getSurfaceM2())
                .param("nombreEtages", u.getNombreEtages())
                .param("etageSituation", u.getEtageSituation())
                .param("anneeConstruction", u.getAnneeConstruction())
                .param("moisCaution", u.getMoisCaution())
                .param("moisAvance", u.getMoisAvance())
                .param("moisHonoraire", u.getMoisHonoraire())
                .param("localisationId", u.getLocalisationId())
                .param("adresseComplete", u.getAdresseComplete())
                .param("latitude", u.getLatitude())
                .param("longitude", u.getLongitude())
                .param("afficherAdresseExacte", u.getAfficherAdresseExacte())
                .param("dateDisponibilite", u.getDateDisponibilite())
                .param("nomContactPublic", u.getNomContactPublic())
                .param("telephoneContact", u.getTelephoneContact())
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public Optional<Propriete> updateStatut(String proprieteUuid, String statut) {
        return jdbcClient.sql(ProprieteQuery.UPDATE_STATUT)
                .param("proprieteUuid", proprieteUuid)
                .param("statut", statut)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public Optional<Propriete> findByUuid(String proprieteUuid) {
        return jdbcClient.sql(ProprieteQuery.FIND_BY_UUID)
                .param("proprieteUuid", proprieteUuid)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public Optional<Propriete> findById(Long proprieteId) {
        return jdbcClient.sql(ProprieteQuery.FIND_BY_ID)
                .param("proprieteId", proprieteId)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public List<Propriete> findByProfil(Long profilId, int limit, int offset) {
        return jdbcClient.sql(ProprieteQuery.FIND_BY_PROFIL)
                .param("profilId", profilId)
                .param("limit", limit)
                .param("offset", offset)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public void incrementVues(String proprieteUuid) {
        jdbcClient.sql(ProprieteQuery.INCREMENT_VUES)
                .param("proprieteUuid", proprieteUuid)
                .update();
    }

    @Override
    public int recordVue(String proprieteUuid, Long userId) {
        return jdbcClient.sql(ProprieteQuery.INSERT_VUE_PROPRIETE)
                .param("proprieteUuid", proprieteUuid)
                .param("userId", userId)
                .update();
    }

    @Override
    public List<Propriete> findEnAttenteValidation(int limit, int offset) {
        return jdbcClient.sql(ProprieteQuery.FIND_EN_ATTENTE_VALIDATION)
                .param("limit", limit)
                .param("offset", offset)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public long countEnAttenteValidation() {
        return jdbcClient.sql(ProprieteQuery.COUNT_EN_ATTENTE_VALIDATION)
                .query(Long.class)
                .single();
    }

    @Override
    public Optional<Long> lookupLocalisationIdByUuid(String localisationUuid) {
        return jdbcClient.sql(ProprieteQuery.LOOKUP_LOCALISATION_ID)
                .param("uuid", localisationUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public void replaceCommodites(Long proprieteId, List<Long> commoditeIds) {
        jdbcClient.sql(ProprieteQuery.CLEAR_COMMODITES)
                .param("proprieteId", proprieteId)
                .update();
        if (commoditeIds == null) return;
        for (Long commoditeId : commoditeIds) {
            jdbcClient.sql(ProprieteQuery.INSERT_COMMODITE)
                    .param("proprieteId", proprieteId)
                    .param("commoditeId", commoditeId)
                    .update();
        }
    }

    @Override
    public List<Commodite> findCommoditesOfPropriete(Long proprieteId) {
        return jdbcClient.sql(ProprieteQuery.FIND_COMMODITES_OF_PROPRIETE)
                .param("proprieteId", proprieteId)
                .query(commoditeRowMapper)
                .list();
    }

    @Override
    public long countActivesForProfil(Long profilId) {
        return jdbcClient.sql(ProprieteQuery.COUNT_ACTIVES_FOR_PROFIL)
                .param("profilId", profilId)
                .query(Long.class)
                .single();
    }

    @Override
    public boolean hasAnyNonDraft(Long profilId) {
        return jdbcClient.sql(ProprieteQuery.EXISTS_NON_DRAFT_FOR_PROFIL)
                .param("profilId", profilId)
                .query(Boolean.class)
                .single();
    }

    @Override
    public Optional<Propriete> rejeter(String proprieteUuid, String motif) {
        return jdbcClient.sql(ProprieteQuery.UPDATE_MOTIF_REJET)
                .param("proprieteUuid", proprieteUuid)
                .param("motif", motif)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public List<Propriete> markRappelExpirationAndReturn(int joursAvant) {
        return jdbcClient.sql(ProprieteQuery.MARK_RAPPEL_EXPIRATION)
                .param("joursAvant", joursAvant)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public List<Propriete> expireOutdatedAndReturn() {
        return jdbcClient.sql(ProprieteQuery.EXPIRE_OUTDATED)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public Optional<Propriete> renouveler(String proprieteUuid, int dureeJours) {
        return jdbcClient.sql(ProprieteQuery.RENOUVELER_PROPRIETE)
                .param("proprieteUuid", proprieteUuid)
                .param("dureeJours", dureeJours)
                .query(proprieteRowMapper)
                .optional();
    }

    // =========================================================================
    // RECHERCHE — Phase 8 (SQL dynamique côté Java)
    // =========================================================================

    /** Tris whitelistés (sécurise contre injection SQL via paramètre `trier`). */
    private static final Set<String> TRIS_AUTORISES = Set.of(
            "PRIX_ASC", "PRIX_DESC", "DATE_DESC", "DISTANCE_ASC", "PERTINENCE"
    );

    @Override
    public List<Propriete> search(ProprieteSearchCriteria c) {
        String tri = resolveTri(c);
        boolean geo = hasGeo(c);
        boolean withFavorite = c.getCurrentUserId() != null;

        // SELECT — ajouts conditionnels (distance si géo, is_favorite si user connecté).
        // Choix : 2 variantes SQL explicites au lieu d'un LEFT JOIN avec NULL.user_id qui
        // s'appuierait sur la sémantique tristate (= NULL ne match jamais). Plus robuste
        // à un futur refactor SQL.
        // Ordre SQL : SELECT … FROM joins [+ LEFT JOIN favori] WHERE … (les JOINs doivent
        // être AVANT le WHERE, sinon syntax error).
        StringBuilder sql = new StringBuilder("SELECT p.*");
        if (geo) sql.append(", ").append(ProprieteQuery.DISTANCE_EXPR).append(" AS distance_m");
        if (withFavorite) sql.append(", (f.favori_id IS NOT NULL) AS is_favorite");
        sql.append(' ').append(ProprieteQuery.SEARCH_JOINS);
        if (withFavorite) {
            sql.append(" LEFT JOIN immo_favori f")
               .append(" ON f.user_id = :currentUserId AND f.propriete_id = p.propriete_id");
        }
        sql.append(ProprieteQuery.SEARCH_WHERE_BASE);
        appendFilters(sql, c, geo);
        sql.append(" ORDER BY ").append(orderByClause(tri, geo));
        sql.append(" LIMIT :limit OFFSET :offset");

        var spec = jdbcClient.sql(sql.toString());
        spec = bindFilters(spec, c, geo);
        if (withFavorite) spec = spec.param("currentUserId", c.getCurrentUserId());
        return spec
                .param("limit", c.getLimit() != null ? c.getLimit() : 20)
                .param("offset", c.getOffset() != null ? c.getOffset() : 0)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public long countSearch(ProprieteSearchCriteria c) {
        boolean geo = hasGeo(c);
        // Pas de besoin de JOIN favoris pour le COUNT (n'affecte pas le nombre de lignes).
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) ");
        sql.append(ProprieteQuery.SEARCH_FROM);
        appendFilters(sql, c, geo);

        var spec = jdbcClient.sql(sql.toString());
        spec = bindFilters(spec, c, geo);
        return spec.query(Long.class).single();
    }

    /** Ajoute les clauses AND seulement quand un filtre est fourni (évite NULL casting JDBC). */
    private void appendFilters(StringBuilder sql, ProprieteSearchCriteria c, boolean geo) {
        if (notBlank(c.getTypeAnnonce()))          sql.append(" AND p.type_annonce = :typeAnnonce");
        if (notBlank(c.getDureeLocation()))        sql.append(" AND p.duree_location = :dureeLocation");
        if (notEmpty(c.getTypeBienCodes()))        sql.append(" AND tb.code = ANY(:typeBienCodes)");
        if (notBlank(c.getVilleUuid()))            sql.append(" AND v.ville_uuid = :villeUuid");
        if (notBlank(c.getCommuneUuid()))          sql.append(" AND c.commune_uuid = :communeUuid");
        if (notBlank(c.getQuartierUuid()))         sql.append(" AND q.quartier_uuid = :quartierUuid");
        if (c.getPrixMin() != null)                sql.append(" AND p.prix >= :prixMin");
        if (c.getPrixMax() != null)                sql.append(" AND p.prix <= :prixMax");
        if (notBlank(c.getDevise()))               sql.append(" AND p.devise = :devise");
        if (c.getChambresMin() != null)            sql.append(" AND p.nombre_chambres >= :chambresMin");
        if (c.getSurfaceMin() != null)             sql.append(" AND p.surface_m2 >= :surfaceMin");
        if (notBlank(c.getQ())) {
            sql.append(" AND (p.titre ILIKE :qLike OR p.description ILIKE :qLike OR p.adresse_complete ILIKE :qLike)");
        }
        if (notEmpty(c.getCommoditesCodes())) {
            // Toutes les commodités demandées doivent être présentes.
            sql.append(" AND (SELECT COUNT(DISTINCT ic.code) FROM immo_propriete_commodite pc")
               .append(" JOIN immo_commodite ic ON ic.commodite_id = pc.commodite_id")
               .append(" WHERE pc.propriete_id = p.propriete_id AND ic.code = ANY(:commoditesCodes))")
               .append(" = :commoditesCount");
        }
        if (geo && c.getRayonKm() != null) {
            sql.append(" AND ").append(ProprieteQuery.DWITHIN_CLAUSE);
        }
    }

    private org.springframework.jdbc.core.simple.JdbcClient.StatementSpec bindFilters(
            org.springframework.jdbc.core.simple.JdbcClient.StatementSpec spec,
            ProprieteSearchCriteria c, boolean geo) {
        if (notBlank(c.getTypeAnnonce()))   spec = spec.param("typeAnnonce", c.getTypeAnnonce());
        if (notBlank(c.getDureeLocation())) spec = spec.param("dureeLocation", c.getDureeLocation());
        if (notEmpty(c.getTypeBienCodes())) spec = spec.param("typeBienCodes", c.getTypeBienCodes().toArray(new String[0]));
        if (notBlank(c.getVilleUuid()))     spec = spec.param("villeUuid", c.getVilleUuid());
        if (notBlank(c.getCommuneUuid()))   spec = spec.param("communeUuid", c.getCommuneUuid());
        if (notBlank(c.getQuartierUuid()))  spec = spec.param("quartierUuid", c.getQuartierUuid());
        if (c.getPrixMin() != null)         spec = spec.param("prixMin", c.getPrixMin());
        if (c.getPrixMax() != null)         spec = spec.param("prixMax", c.getPrixMax());
        if (notBlank(c.getDevise()))        spec = spec.param("devise", c.getDevise());
        if (c.getChambresMin() != null)     spec = spec.param("chambresMin", c.getChambresMin());
        if (c.getSurfaceMin() != null)      spec = spec.param("surfaceMin", c.getSurfaceMin());
        if (notBlank(c.getQ()))             spec = spec.param("qLike", "%" + c.getQ() + "%");
        if (notEmpty(c.getCommoditesCodes())) {
            // Dédoublonnage : ?commoditesCodes=PARKING,PARKING ne doit pas
            // exiger 2 fois la même → count = 1, pas 2.
            var dedup = c.getCommoditesCodes().stream().distinct().toList();
            spec = spec.param("commoditesCodes", dedup.toArray(new String[0]))
                       .param("commoditesCount", (long) dedup.size());
        }
        if (geo) {
            spec = spec.param("lat", c.getLat()).param("lng", c.getLng());
            if (c.getRayonKm() != null) spec = spec.param("rayonMeters", c.getRayonKm() * 1000.0);
        }
        return spec;
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static boolean notEmpty(List<String> l) { return l != null && !l.isEmpty(); }
    private static boolean hasGeo(ProprieteSearchCriteria c) {
        return c.getLat() != null && c.getLng() != null;
    }

    private String resolveTri(ProprieteSearchCriteria c) {
        String tri = c.trierOrDefault();
        if (!TRIS_AUTORISES.contains(tri)) {
            throw new ApiException("Tri non supporté : " + tri
                    + ". Valeurs autorisées : " + TRIS_AUTORISES);
        }
        if ("DISTANCE_ASC".equals(tri) && !hasGeo(c)) {
            return "DATE_DESC";
        }
        return tri;
    }

    private static String orderByClause(String tri, boolean geo) {
        return switch (tri) {
            case "PRIX_ASC"    -> "p.prix ASC NULLS LAST, p.date_publication DESC";
            case "PRIX_DESC"   -> "p.prix DESC NULLS LAST, p.date_publication DESC";
            case "DATE_DESC"   -> "p.date_publication DESC NULLS LAST, p.propriete_id DESC";
            case "DISTANCE_ASC" -> geo ? ProprieteQuery.DISTANCE_EXPR + " ASC" : "p.date_publication DESC";
            case "PERTINENCE"  -> "p.premium DESC, p.date_publication DESC";
            default -> "p.date_publication DESC";
        };
    }
}
