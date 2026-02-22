package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Billet;
import io.multi.billetterieservice.domain.Commande;
import io.multi.billetterieservice.domain.Offre;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.billetterieservice.dto.CommandeRequest;
import io.multi.billetterieservice.event.Event;
import io.multi.billetterieservice.event.EventType;
import io.multi.billetterieservice.event.Notification;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.query.CommandeQuery;
import io.multi.billetterieservice.service.CommandeService;
import io.multi.billetterieservice.service.OffreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.springframework.kafka.support.KafkaHeaders.TOPIC;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CommandeServiceImpl implements CommandeService {

    private static final String NOTIFICATION_TOPIC = "NOTIFICATION_TOPIC";

    private final JdbcClient jdbcClient;
    private final OffreService offreService;
    private final UserClient userClient;
    private final KafkaTemplate<String, Notification> kafkaTemplate;

    @Override
    public Commande creerCommande(CommandeRequest request, Long userId) {
        log.info("Création de commande - offreUuid: {}, userId: {}, passagers: {}",
                request.getOffreUuid(), userId, request.getPassagers().size());

        // 1. Vérifier l'offre
        Offre offre = offreService.getByUuid(request.getOffreUuid());
        if (!"OUVERT".equals(offre.getStatut())) {
            throw new ApiException("L'offre n'est pas disponible (statut: " + offre.getStatut() + ")");
        }

        int nombrePassagers = request.getPassagers().size();
        if (offre.getNombrePlacesDisponibles() < nombrePassagers) {
            throw new ApiException("Places insuffisantes. Disponibles: " + offre.getNombrePlacesDisponibles()
                    + ", demandées: " + nombrePassagers);
        }

        // 2. Résoudre le mode de règlement
        var modeReglement = jdbcClient.sql(CommandeQuery.FIND_MODE_REGLEMENT_BY_CODE)
                .param("code", request.getModeReglementCode())
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("mode_reglement_id"),
                        rs.getBigDecimal("frais_pourcentage"),
                        rs.getBigDecimal("frais_fixe")
                })
                .optional()
                .orElseThrow(() -> new ApiException("Mode de règlement invalide: " + request.getModeReglementCode()));

        Long modeReglementId = (Long) modeReglement[0];
        BigDecimal fraisPourcentage = (BigDecimal) modeReglement[1];
        BigDecimal fraisFixe = (BigDecimal) modeReglement[2];

        // 3. Calculer les montants
        BigDecimal montantUnitaire = offre.getMontantEffectif();
        BigDecimal montantPlaces = montantUnitaire.multiply(BigDecimal.valueOf(nombrePassagers));
        BigDecimal montantFraisService = new BigDecimal("5000");
        BigDecimal montantFraisPaiement = montantPlaces.multiply(fraisPourcentage)
                .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP)
                .add(fraisFixe);
        BigDecimal montantTotal = montantPlaces.add(montantFraisService);
        BigDecimal montantPaye = montantTotal.add(montantFraisPaiement);
        String referencePaiement = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 4. Insérer la commande
        var commandeResult = jdbcClient.sql(CommandeQuery.INSERT_COMMANDE)
                .param("offreId", offre.getOffreId())
                .param("userId", userId)
                .param("modeReglementId", modeReglementId)
                .param("nombrePlaces", nombrePassagers)
                .param("montantUnitaire", montantUnitaire)
                .param("montantTotal", montantTotal)
                .param("montantFrais", montantFraisService)
                .param("montantPaye", montantPaye)
                .param("devise", "GNF")
                .param("statut", "CONFIRMEE")
                .param("referencePaiement", referencePaiement)
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("commande_id"),
                        rs.getString("commande_uuid"),
                        rs.getString("numero_commande"),
                        rs.getObject("created_at", OffsetDateTime.class)
                })
                .single();

        Long commandeId = (Long) commandeResult[0];
        String commandeUuid = (String) commandeResult[1];
        String numeroCommande = (String) commandeResult[2];
        OffsetDateTime createdAt = (OffsetDateTime) commandeResult[3];

        log.info("Commande créée: {} ({})", numeroCommande, commandeUuid);

        // 5. Insérer les billets
        List<Billet> billets = new ArrayList<>();
        for (CommandeRequest.PassagerDto passager : request.getPassagers()) {
            String nomComplet = passager.getPrenom() + " " + passager.getNom();
            var billetResult = jdbcClient.sql(CommandeQuery.INSERT_BILLET)
                    .param("commandeId", commandeId)
                    .param("nomPassager", nomComplet)
                    .param("telephonePassager", passager.getTelephone())
                    .param("pieceIdentite", passager.getPieceIdentite())
                    .query((rs, rowNum) -> Billet.builder()
                            .billetId(rs.getLong("billet_id"))
                            .billetUuid(rs.getString("billet_uuid"))
                            .codeBillet(rs.getString("code_billet"))
                            .statut(rs.getString("statut"))
                            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                            .commandeId(commandeId)
                            .nomPassager(nomComplet)
                            .telephonePassager(passager.getTelephone())
                            .pieceIdentite(passager.getPieceIdentite())
                            .build())
                    .single();

            billets.add(billetResult);
            log.info("Billet créé: {} pour {}", billetResult.getCodeBillet(), nomComplet);
        }

        // 6. Insérer le paiement
        jdbcClient.sql(CommandeQuery.INSERT_PAIEMENT)
                .param("commandeId", commandeId)
                .param("modeReglementId", modeReglementId)
                .param("montant", montantPaye)
                .param("devise", "GNF")
                .param("referenceExterne", referencePaiement)
                .param("statut", "REUSSI")
                .query((rs, rowNum) -> rs.getLong("paiement_id"))
                .single();

        log.info("Paiement enregistré: {} GNF via {}", montantPaye, request.getModeReglementCode());

        // 7. Envoyer notification Kafka (non-bloquant)
        try {
            String billetCodes = billets.stream()
                    .map(Billet::getCodeBillet)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            String passagerNoms = billets.stream()
                    .map(Billet::getNomPassager)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");

            String passagerPhone = billets.stream()
                    .map(Billet::getTelephonePassager)
                    .filter(t -> t != null && !t.isBlank())
                    .findFirst()
                    .orElse("");

            // Récupérer l'email de l'utilisateur qui réserve
            String userEmail = "";
            try {
                User user = userClient.getUserById(userId);
                if (user != null && user.getEmail() != null) {
                    userEmail = user.getEmail();
                }
            } catch (Exception e) {
                log.warn("Impossible de récupérer l'email utilisateur {}: {}", userId, e.getMessage());
            }

            var event = new Event(EventType.COMMANDE_CONFIRMEE, Map.ofEntries(
                    Map.entry("numeroCommande", numeroCommande),
                    Map.entry("email", offre.getUserEmail() != null ? offre.getUserEmail() : ""),
                    Map.entry("userEmail", userEmail),
                    Map.entry("name", passagerNoms),
                    Map.entry("phone", passagerPhone),
                    Map.entry("trajet", offre.getVilleDepartLibelle() + " \u2192 " + offre.getVilleArriveeLibelle()),
                    Map.entry("dateDepart", offre.getDateDepart().toString()),
                    Map.entry("heureDepart", offre.getHeureDepart().toString()),
                    Map.entry("nombrePlaces", String.valueOf(nombrePassagers)),
                    Map.entry("montantPaye", montantPaye.toPlainString()),
                    Map.entry("billetCodes", billetCodes),
                    Map.entry("referencePaiement", referencePaiement)
            ));
            var message = MessageBuilder.withPayload(new Notification(event))
                    .setHeader(TOPIC, NOTIFICATION_TOPIC)
                    .build();

            final String cmdNum = numeroCommande;
            CompletableFuture.runAsync(() -> {
                try {
                    kafkaTemplate.send(message);
                    log.info("Notification Kafka envoyée pour commande: {}", cmdNum);
                } catch (Exception ex) {
                    log.error("Kafka indisponible, notification non envoyée pour: {}", cmdNum, ex);
                }
            });
        } catch (Exception e) {
            log.error("Erreur préparation notification Kafka: {}", e.getMessage());
        }

        // 8. Construire et retourner la commande complète
        return Commande.builder()
                .commandeId(commandeId)
                .commandeUuid(commandeUuid)
                .numeroCommande(numeroCommande)
                .offreId(offre.getOffreId())
                .userId(userId)
                .modeReglementId(modeReglementId)
                .nombrePlaces(nombrePassagers)
                .montantUnitaire(montantUnitaire)
                .montantTotal(montantTotal)
                .montantFrais(montantFraisService)
                .montantPaye(montantPaye)
                .devise("GNF")
                .statut("CONFIRMEE")
                .referencePaiement(referencePaiement)
                .createdAt(createdAt)
                .offreUuid(offre.getOffreUuid())
                .dateDepart(offre.getDateDepart())
                .heureDepart(offre.getHeureDepart())
                .villeDepartLibelle(offre.getVilleDepartLibelle())
                .villeArriveeLibelle(offre.getVilleArriveeLibelle())
                .siteDepart(offre.getSiteDepart())
                .siteArrivee(offre.getSiteArrivee())
                .billets(billets)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Commande getByUuid(String commandeUuid) {
        log.info("Récupération de la commande: {}", commandeUuid);
        Commande commande = jdbcClient.sql(CommandeQuery.FIND_COMMANDE_BY_UUID)
                .param("commandeUuid", commandeUuid)
                .query((rs, rowNum) -> Commande.builder()
                        .commandeId(rs.getLong("commande_id"))
                        .commandeUuid(rs.getString("commande_uuid"))
                        .numeroCommande(rs.getString("numero_commande"))
                        .offreId(rs.getLong("offre_id"))
                        .userId(rs.getLong("user_id"))
                        .modeReglementId(rs.getLong("mode_reglement_id"))
                        .nombrePlaces(rs.getInt("nombre_places"))
                        .montantUnitaire(rs.getBigDecimal("montant_unitaire"))
                        .montantTotal(rs.getBigDecimal("montant_total"))
                        .montantFrais(rs.getBigDecimal("montant_frais"))
                        .montantRemise(rs.getBigDecimal("montant_remise"))
                        .montantPaye(rs.getBigDecimal("montant_paye"))
                        .devise(rs.getString("devise"))
                        .statut(rs.getString("statut"))
                        .dateReservation(rs.getObject("date_reservation", OffsetDateTime.class))
                        .dateConfirmation(rs.getObject("date_confirmation", OffsetDateTime.class))
                        .datePaiement(rs.getObject("date_paiement", OffsetDateTime.class))
                        .referencePaiement(rs.getString("reference_paiement"))
                        .notes(rs.getString("notes"))
                        .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                        .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                        .offreUuid(rs.getString("offre_uuid"))
                        .dateDepart(rs.getObject("date_depart", java.time.LocalDate.class))
                        .heureDepart(rs.getObject("heure_depart", java.time.LocalTime.class))
                        .villeDepartLibelle(rs.getString("ville_depart_libelle"))
                        .villeArriveeLibelle(rs.getString("ville_arrivee_libelle"))
                        .siteDepart(rs.getString("site_depart"))
                        .siteArrivee(rs.getString("site_arrivee"))
                        .vehiculeImmatriculation(rs.getString("vehicule_immatriculation"))
                        .nomChauffeur(rs.getString("nom_chauffeur"))
                        .contactChauffeur(rs.getString("contact_chauffeur"))
                        .build())
                .optional()
                .orElseThrow(() -> new ApiException("Commande non trouvée: " + commandeUuid));

        // Charger les billets
        List<Billet> billets = jdbcClient.sql(CommandeQuery.FIND_BILLETS_BY_COMMANDE_ID)
                .param("commandeId", commande.getCommandeId())
                .query((rs, rowNum) -> Billet.builder()
                        .billetId(rs.getLong("billet_id"))
                        .billetUuid(rs.getString("billet_uuid"))
                        .commandeId(rs.getLong("commande_id"))
                        .codeBillet(rs.getString("code_billet"))
                        .numeroSiege(rs.getString("numero_siege"))
                        .nomPassager(rs.getString("nom_passager"))
                        .telephonePassager(rs.getString("telephone_passager"))
                        .pieceIdentite(rs.getString("piece_identite"))
                        .statut(rs.getString("statut"))
                        .dateValidation(rs.getObject("date_validation", OffsetDateTime.class))
                        .qrCodeData(rs.getString("qr_code_data"))
                        .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                        .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                        .build())
                .list();

        commande.setBillets(billets);
        return commande;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Commande> getCommandesByUserId(Long userId) {
        log.info("Récupération des commandes pour userId: {}", userId);

        List<Commande> commandes = jdbcClient.sql(CommandeQuery.FIND_COMMANDES_BY_USER_ID)
                .param("userId", userId)
                .query((rs, rowNum) -> Commande.builder()
                        .commandeId(rs.getLong("commande_id"))
                        .commandeUuid(rs.getString("commande_uuid"))
                        .numeroCommande(rs.getString("numero_commande"))
                        .offreId(rs.getLong("offre_id"))
                        .userId(rs.getLong("user_id"))
                        .modeReglementId(rs.getLong("mode_reglement_id"))
                        .nombrePlaces(rs.getInt("nombre_places"))
                        .montantUnitaire(rs.getBigDecimal("montant_unitaire"))
                        .montantTotal(rs.getBigDecimal("montant_total"))
                        .montantFrais(rs.getBigDecimal("montant_frais"))
                        .montantRemise(rs.getBigDecimal("montant_remise"))
                        .montantPaye(rs.getBigDecimal("montant_paye"))
                        .devise(rs.getString("devise"))
                        .statut(rs.getString("statut"))
                        .dateReservation(rs.getObject("date_reservation", OffsetDateTime.class))
                        .dateConfirmation(rs.getObject("date_confirmation", OffsetDateTime.class))
                        .datePaiement(rs.getObject("date_paiement", OffsetDateTime.class))
                        .referencePaiement(rs.getString("reference_paiement"))
                        .notes(rs.getString("notes"))
                        .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                        .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                        .offreUuid(rs.getString("offre_uuid"))
                        .dateDepart(rs.getObject("date_depart", java.time.LocalDate.class))
                        .heureDepart(rs.getObject("heure_depart", java.time.LocalTime.class))
                        .villeDepartLibelle(rs.getString("ville_depart_libelle"))
                        .villeArriveeLibelle(rs.getString("ville_arrivee_libelle"))
                        .siteDepart(rs.getString("site_depart"))
                        .siteArrivee(rs.getString("site_arrivee"))
                        .vehiculeImmatriculation(rs.getString("vehicule_immatriculation"))
                        .nomChauffeur(rs.getString("nom_chauffeur"))
                        .contactChauffeur(rs.getString("contact_chauffeur"))
                        .build())
                .list();

        for (Commande commande : commandes) {
            List<Billet> billets = jdbcClient.sql(CommandeQuery.FIND_BILLETS_BY_COMMANDE_ID)
                    .param("commandeId", commande.getCommandeId())
                    .query((rs, rowNum) -> Billet.builder()
                            .billetId(rs.getLong("billet_id"))
                            .billetUuid(rs.getString("billet_uuid"))
                            .commandeId(rs.getLong("commande_id"))
                            .codeBillet(rs.getString("code_billet"))
                            .numeroSiege(rs.getString("numero_siege"))
                            .nomPassager(rs.getString("nom_passager"))
                            .telephonePassager(rs.getString("telephone_passager"))
                            .pieceIdentite(rs.getString("piece_identite"))
                            .statut(rs.getString("statut"))
                            .dateValidation(rs.getObject("date_validation", OffsetDateTime.class))
                            .qrCodeData(rs.getString("qr_code_data"))
                            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                            .build())
                    .list();
            commande.setBillets(billets);
        }

        log.info("Trouvé {} commandes pour userId: {}", commandes.size(), userId);
        return commandes;
    }

    @Override
    public Commande annulerCommande(String commandeUuid, Long userId) {
        log.info("Annulation de la commande: {} par userId: {}", commandeUuid, userId);

        // 1. Récupérer la commande pour vérifier qu'elle appartient à l'utilisateur
        Commande commande = getByUuid(commandeUuid);
        if (!commande.getUserId().equals(userId)) {
            throw new ApiException("Vous n'êtes pas autorisé à annuler cette commande");
        }
        if (!List.of("CONFIRMEE", "PAYEE", "EN_ATTENTE").contains(commande.getStatut())) {
            throw new ApiException("Impossible d'annuler une commande avec le statut: " + commande.getStatut());
        }

        // 2. Annuler la commande
        int updated = jdbcClient.sql(CommandeQuery.ANNULER_COMMANDE)
                .param("commandeUuid", commandeUuid)
                .param("userId", userId)
                .update();

        if (updated == 0) {
            throw new ApiException("Impossible d'annuler la commande");
        }

        // 3. Annuler les billets associés
        jdbcClient.sql(CommandeQuery.ANNULER_BILLETS_BY_COMMANDE)
                .param("commandeId", commande.getCommandeId())
                .update();

        log.info("Commande {} annulée avec succès ({} billets annulés)", commandeUuid, commande.getBillets().size());

        // 4. Restituer les places sur l'offre
        try {
            offreService.libererPlaces(commande.getOffreUuid(), commande.getNombrePlaces());
            log.info("Places restituées: {} places sur offre {}", commande.getNombrePlaces(), commande.getOffreUuid());
        } catch (Exception e) {
            log.warn("Impossible de restituer les places pour offre {}: {}", commande.getOffreUuid(), e.getMessage());
        }

        // 5. Envoyer notification Kafka d'annulation (non-bloquant)
        try {
            String billetCodes = commande.getBillets().stream()
                    .map(Billet::getCodeBillet)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            String passagerNoms = commande.getBillets().stream()
                    .map(Billet::getNomPassager)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
            String passagerPhone = commande.getBillets().stream()
                    .map(Billet::getTelephonePassager)
                    .filter(t -> t != null && !t.isBlank())
                    .findFirst()
                    .orElse("");

            // Récupérer les emails (transporteur + passager)
            String email = "";
            try {
                Offre offre = offreService.getByUuid(commande.getOffreUuid());
                email = offre.getUserEmail() != null ? offre.getUserEmail() : "";
            } catch (Exception e) {
                log.warn("Impossible de récupérer l'email depuis l'offre: {}", e.getMessage());
            }
            String userEmail = "";
            try {
                User user = userClient.getUserById(commande.getUserId());
                if (user != null && user.getEmail() != null) {
                    userEmail = user.getEmail();
                }
            } catch (Exception e) {
                log.warn("Impossible de récupérer l'email utilisateur {}: {}", commande.getUserId(), e.getMessage());
            }

            var event = new Event(EventType.COMMANDE_ANNULEE, Map.ofEntries(
                    Map.entry("numeroCommande", commande.getNumeroCommande()),
                    Map.entry("email", email),
                    Map.entry("userEmail", userEmail),
                    Map.entry("name", passagerNoms),
                    Map.entry("phone", passagerPhone),
                    Map.entry("trajet", commande.getVilleDepartLibelle() + " \u2192 " + commande.getVilleArriveeLibelle()),
                    Map.entry("dateDepart", commande.getDateDepart().toString()),
                    Map.entry("heureDepart", commande.getHeureDepart().toString()),
                    Map.entry("nombrePlaces", String.valueOf(commande.getNombrePlaces())),
                    Map.entry("montantPaye", commande.getMontantPaye().toPlainString()),
                    Map.entry("billetCodes", billetCodes),
                    Map.entry("referencePaiement", commande.getReferencePaiement() != null ? commande.getReferencePaiement() : "")
            ));
            var message = MessageBuilder.withPayload(new Notification(event))
                    .setHeader(TOPIC, NOTIFICATION_TOPIC)
                    .build();

            final String cmdNum = commande.getNumeroCommande();
            CompletableFuture.runAsync(() -> {
                try {
                    kafkaTemplate.send(message);
                    log.info("Notification Kafka annulation envoyée pour commande: {}", cmdNum);
                } catch (Exception ex) {
                    log.error("Kafka indisponible, notification annulation non envoyée pour: {}", cmdNum, ex);
                }
            });
        } catch (Exception e) {
            log.error("Erreur préparation notification Kafka annulation: {}", e.getMessage());
        }

        // 6. Retourner la commande mise à jour
        return getByUuid(commandeUuid);
    }
}
