package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.dto.AvisRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.service.AvisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AvisServiceImpl implements AvisService {

    private final JdbcClient jdbcClient;

    private static final String FIND_COMMANDE_FOR_AVIS = """
        SELECT c.commande_id, c.user_id, c.statut,
               o.vehicule_id
        FROM commandes c
        INNER JOIN offres o ON c.offre_id = o.offre_id
        WHERE c.commande_uuid = :commandeUuid
        """;

    private static final String CHECK_AVIS_EXISTS = """
        SELECT COUNT(*) FROM avis WHERE commande_id = :commandeId
        """;

    private static final String INSERT_AVIS = """
        INSERT INTO avis (user_id, commande_id, vehicule_id, note, commentaire)
        VALUES (:userId, :commandeId, :vehiculeId, :note, :commentaire)
        """;

    @Override
    public void createAvis(AvisRequest request, Long userId) {
        log.info("Création avis - commandeUuid: {}, userId: {}, note: {}", request.getCommandeUuid(), userId, request.getNote());

        // 1. Vérifier la commande
        var commande = jdbcClient.sql(FIND_COMMANDE_FOR_AVIS)
                .param("commandeUuid", request.getCommandeUuid())
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("commande_id"),
                        rs.getLong("user_id"),
                        rs.getString("statut"),
                        rs.getLong("vehicule_id")
                })
                .optional()
                .orElseThrow(() -> new ApiException("Commande non trouvée: " + request.getCommandeUuid()));

        Long commandeId = (Long) commande[0];
        Long commandeUserId = (Long) commande[1];
        String statut = (String) commande[2];
        Long vehiculeId = (Long) commande[3];

        // 2. Vérifier que la commande appartient à l'utilisateur
        if (!commandeUserId.equals(userId)) {
            throw new ApiException("Vous n'êtes pas autorisé à donner un avis sur cette commande");
        }

        // 3. Vérifier le statut
        if (!java.util.List.of("CONFIRMEE", "PAYEE", "UTILISEE", "TERMINEE").contains(statut)) {
            throw new ApiException("Impossible de donner un avis pour une commande avec le statut: " + statut);
        }

        // 4. Vérifier qu'aucun avis n'existe déjà
        Long count = jdbcClient.sql(CHECK_AVIS_EXISTS)
                .param("commandeId", commandeId)
                .query(Long.class)
                .single();

        if (count > 0) {
            throw new ApiException("Un avis a déjà été donné pour cette commande");
        }

        // 5. Insérer l'avis
        jdbcClient.sql(INSERT_AVIS)
                .param("userId", userId)
                .param("commandeId", commandeId)
                .param("vehiculeId", vehiculeId)
                .param("note", request.getNote())
                .param("commentaire", request.getCommentaire())
                .update();

        log.info("Avis créé pour commande {} - note: {}", request.getCommandeUuid(), request.getNote());
    }
}
