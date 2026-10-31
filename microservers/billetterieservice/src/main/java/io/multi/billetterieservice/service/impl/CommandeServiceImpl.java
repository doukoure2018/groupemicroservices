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
import io.multi.billetterieservice.service.paiement.DemandePaiement;
import io.multi.billetterieservice.service.paiement.EtatPaiement;
import io.multi.billetterieservice.service.paiement.PrestatairePaiement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
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

    /**
     * Prestataires de paiement déclarés. Le mode de règlement choisi désigne
     * celui qui traite la transaction ; aucun n'implique un règlement hors
     * ligne (espèces, virement), confirmé immédiatement comme auparavant.
     */
    private final List<PrestatairePaiement> prestataires;

    /** Adresses de retour, injectées car propres à l'environnement. */
    @org.springframework.beans.factory.annotation.Value("${paiement.url-retour:}")
    private String urlRetourPaiement;

    @org.springframework.beans.factory.annotation.Value("${paiement.url-notification:}")
    private String urlNotificationPaiement;

    private java.util.Optional<PrestatairePaiement> prestatairePour(String codeModeReglement) {
        return prestataires.stream().filter(p -> p.supporte(codeModeReglement)).findFirst();
    }

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
        // UUID complet, et non tronqué à 8 caractères : 32 bits suffisaient pour
        // qu'une collision devienne probable vers quelques dizaines de milliers
        // de commandes, alors que la confirmation lit cette référence en
        // attendant une ligne unique. L'index uq_commandes_reference_paiement
        // ferme la porte, encore faut-il ne jamais avoir à la pousser.
        String referencePaiement = "PAY-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();

        // 3 bis. Mode en ligne ou hors ligne ?
        // Un prestataire déclaré pour ce mode signifie que le client doit payer
        // avant d'obtenir ses billets. Sans prestataire (espèces, virement), le
        // règlement se fait hors de la plateforme et la commande est confirmée
        // immédiatement, comme avant l'introduction du paiement en ligne.
        var prestataire = prestatairePour(request.getModeReglementCode());
        boolean enLigne = prestataire.isPresent();
        if (enLigne) {
            // Le montant encaissé doit être exactement celui enregistré, d'où la
            // normalisation AVANT l'insertion et non au moment de l'appel.
            montantPaye = prestataire.get().normaliserMontant(montantPaye);
        }
        String statutCommande = enLigne ? "EN_ATTENTE" : "CONFIRMEE";
        String statutBillet = enLigne ? "EN_ATTENTE" : "VALIDE";
        String statutPaiement = enLigne ? "EN_ATTENTE" : "REUSSI";

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
                .param("statut", statutCommande)
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
                    .param("statut", statutBillet)
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
                .param("statut", statutPaiement)
                .param("dateConfirmation", enLigne ? null : OffsetDateTime.now())
                .query((rs, rowNum) -> rs.getLong("paiement_id"))
                .single();

        log.info("Paiement {} enregistré: {} GNF via {}", statutPaiement, montantPaye, request.getModeReglementCode());

        // 7. Prévenir le client, ou lancer le paiement
        String urlPaiement = null;
        if (enLigne) {
            // L'appel au prestataire est DANS la transaction : s'il échoue, la
            // commande et ses billets disparaissent et les places sont rendues.
            // Mieux vaut aucune commande qu'une commande orpheline impayable.
            urlPaiement = prestataire.get().initier(DemandePaiement.builder()
                    .reference(referencePaiement)
                    .montant(montantPaye)
                    .devise("GNF")
                    .description("Reservation " + numeroCommande + " - "
                            + offre.getVilleDepartLibelle() + " vers " + offre.getVilleArriveeLibelle())
                    .clientNom(request.getPassagers().get(0).getNom())
                    .clientPrenom(request.getPassagers().get(0).getPrenom())
                    .clientEmail(emailUtilisateur(userId))
                    .clientTelephone(request.getPassagers().get(0).getTelephone())
                    .urlRetour(urlRetourPaiement)
                    .urlNotification(urlNotificationPaiement)
                    .build()).urlPaiement();
            log.info("Commande {} en attente de paiement {}", numeroCommande, request.getModeReglementCode());
        } else {
            // Hors ligne : la commande est déjà confirmée, on peut notifier.
            notifierCommandeConfirmee(numeroCommande, offre, userId, billets,
                    nombrePassagers, montantPaye, referencePaiement);
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
                .statut(statutCommande)
                .referencePaiement(referencePaiement)
                .urlPaiement(urlPaiement)
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
                        .niveauRemplissage(rs.getObject("niveau_remplissage") != null ? rs.getInt("niveau_remplissage") : null)
                        .pointRendezVous(rs.getString("point_rendez_vous"))
                        .typeVehicule(rs.getString("type_vehicule"))
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
                        .niveauRemplissage(rs.getObject("niveau_remplissage") != null ? rs.getInt("niveau_remplissage") : null)
                        .pointRendezVous(rs.getString("point_rendez_vous"))
                        .typeVehicule(rs.getString("type_vehicule"))
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

        // 4. Restitution des places : gérée EXCLUSIVEMENT par le trigger SQL
        // update_offre_places (branche statut → ANNULEE de l'étape 2). Appeler
        // libererPlaces ici libérerait les places une seconde fois (disponibles
        // surévaluées, niveau_remplissage faussé → surbooking possible).

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

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getOffresAlternatives(String commandeUuid, Long userId) {
        Commande commande = getByUuid(commandeUuid);
        if (!commande.getUserId().equals(userId)) {
            throw new ApiException("Vous n'êtes pas autorisé à accéder à cette commande");
        }
        Offre offreActuelle = offreService.getByUuid(commande.getOffreUuid());
        LocalDateTime now = LocalDateTime.now();

        return offreService.getByTrajet(offreActuelle.getTrajetUuid()).stream()
                .filter(o -> !o.getOffreUuid().equals(offreActuelle.getOffreUuid()))
                .filter(o -> "OUVERT".equals(o.getStatut()))
                .filter(o -> o.getNombrePlacesDisponibles() != null
                        && o.getNombrePlacesDisponibles() >= commande.getNombrePlaces())
                .filter(o -> LocalDateTime.of(o.getDateDepart(), o.getHeureDepart()).isAfter(now))
                .sorted((a, b) -> LocalDateTime.of(a.getDateDepart(), a.getHeureDepart())
                        .compareTo(LocalDateTime.of(b.getDateDepart(), b.getHeureDepart())))
                .toList();
    }

    @Override
    public Commande modifierDateCommande(String commandeUuid, String nouvelleOffreUuid, Long userId) {
        log.info("Modification date commande {} -> offre {} par userId {}", commandeUuid, nouvelleOffreUuid, userId);

        Commande commande = getByUuid(commandeUuid);
        if (!commande.getUserId().equals(userId)) {
            throw new ApiException("Vous n'êtes pas autorisé à modifier cette commande");
        }
        if (!List.of("CONFIRMEE", "PAYEE").contains(commande.getStatut())) {
            throw new ApiException("Seules les commandes confirmées ou payées peuvent être modifiées (statut: "
                    + commande.getStatut() + ")");
        }

        Offre offreActuelle = offreService.getByUuid(commande.getOffreUuid());
        LocalDateTime now = LocalDateTime.now();

        // Éligibilité : l'offre actuelle ne doit pas être déjà partie.
        if (!LocalDateTime.of(offreActuelle.getDateDepart(), offreActuelle.getHeureDepart()).isAfter(now)) {
            throw new ApiException("Ce voyage est déjà parti, la date ne peut plus être modifiée");
        }
        if (nouvelleOffreUuid.equals(offreActuelle.getOffreUuid())) {
            throw new ApiException("La nouvelle offre est identique à l'offre actuelle");
        }

        Offre nouvelleOffre = offreService.getByUuid(nouvelleOffreUuid);

        if (!nouvelleOffre.getTrajetUuid().equals(offreActuelle.getTrajetUuid())) {
            throw new ApiException("La nouvelle offre doit concerner le même trajet");
        }
        if (!"OUVERT".equals(nouvelleOffre.getStatut())) {
            throw new ApiException("La nouvelle offre n'est pas disponible (statut: " + nouvelleOffre.getStatut() + ")");
        }
        if (!LocalDateTime.of(nouvelleOffre.getDateDepart(), nouvelleOffre.getHeureDepart()).isAfter(now)) {
            throw new ApiException("La nouvelle date de départ doit être dans le futur");
        }
        if (nouvelleOffre.getNombrePlacesDisponibles() == null
                || nouvelleOffre.getNombrePlacesDisponibles() < commande.getNombrePlaces()) {
            throw new ApiException("Pas assez de places sur la nouvelle offre");
        }

        // Transaction (classe @Transactional) : réserver la nouvelle (fail fast si plein),
        // libérer l'ancienne, repointer la commande. Le trigger places ne s'active pas
        // sur un changement d'offre_id (statut inchangé) → gestion manuelle ici.
        offreService.reserverPlaces(nouvelleOffreUuid, commande.getNombrePlaces());
        offreService.libererPlaces(offreActuelle.getOffreUuid(), commande.getNombrePlaces());

        int updated = jdbcClient.sql(CommandeQuery.UPDATE_COMMANDE_OFFRE)
                .param("offreId", nouvelleOffre.getOffreId())
                .param("commandeUuid", commandeUuid)
                .param("userId", userId)
                .update();
        if (updated == 0) {
            throw new ApiException("Impossible de modifier la commande");
        }

        log.info("Commande {} déplacée: {} -> {} (montant d'origine conservé)", commandeUuid,
                offreActuelle.getDateDepart(), nouvelleOffre.getDateDepart());

        // Montant d'origine conservé (MVP paiement simulé — dette réconciliation prix).
        return getByUuid(commandeUuid);
    }

    // =========================================================================
    // Paiement en ligne
    // =========================================================================

    @Override
    @Transactional
    public Commande confirmerPaiement(String referencePaiement) {
        var contexte = jdbcClient.sql(CommandeQuery.FIND_CONTEXTE_PAIEMENT)
                .param("reference", referencePaiement)
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("commande_id"),
                        rs.getString("commande_uuid"),
                        rs.getLong("user_id"),
                        rs.getString("statut"),
                        rs.getString("mode_code")
                })
                .optional()
                .orElseThrow(() -> new ApiException("Référence de paiement inconnue: " + referencePaiement));

        Long commandeId = (Long) contexte[0];
        String commandeUuid = (String) contexte[1];
        Long userId = (Long) contexte[2];
        String statutCourant = (String) contexte[3];
        String modeCode = (String) contexte[4];

        // Idempotence : un prestataire renotifie volontiers le même encaissement,
        // et le client peut recharger la page de retour autant qu'il veut.
        if (!"EN_ATTENTE".equals(statutCourant)) {
            log.info("Commande {} déjà au statut {}, retour de paiement ignoré", commandeUuid, statutCourant);
            return getByUuid(commandeUuid);
        }

        var prestataire = prestatairePour(modeCode)
                .orElseThrow(() -> new ApiException("Aucun prestataire ne traite le mode " + modeCode));

        // On ne croit jamais la notification sur parole : elle n'est qu'une
        // requête HTTP, que n'importe qui peut fabriquer.
        EtatPaiement etat = prestataire.verifier(referencePaiement);

        switch (etat) {
            case REUSSI -> {
                jdbcClient.sql(CommandeQuery.CONFIRMER_COMMANDE).param("commandeId", commandeId).update();
                jdbcClient.sql(CommandeQuery.VALIDER_BILLETS_BY_COMMANDE).param("commandeId", commandeId).update();
                jdbcClient.sql(CommandeQuery.MAJ_STATUT_PAIEMENT)
                        .param("statut", "REUSSI")
                        .param("dateConfirmation", OffsetDateTime.now())
                        .param("commandeId", commandeId)
                        .update();
                log.info("Paiement {} encaissé, commande {} confirmée", referencePaiement, commandeUuid);

                Commande confirmee = getByUuid(commandeUuid);
                try {
                    Offre offre = offreService.getByUuid(confirmee.getOffreUuid());
                    notifierCommandeConfirmee(confirmee.getNumeroCommande(), offre, userId,
                            confirmee.getBillets(), confirmee.getNombrePlaces(),
                            confirmee.getMontantPaye(), referencePaiement);
                } catch (Exception e) {
                    // La commande est payée et confirmée : un échec de notification
                    // ne doit surtout pas faire échouer la transaction.
                    log.error("Notification de confirmation impossible pour {}: {}", commandeUuid, e.getMessage());
                }
                return confirmee;
            }
            case ECHOUE -> {
                jdbcClient.sql(CommandeQuery.ECHOUER_COMMANDE).param("commandeId", commandeId).update();
                jdbcClient.sql(CommandeQuery.ANNULER_BILLETS_BY_COMMANDE).param("commandeId", commandeId).update();
                jdbcClient.sql(CommandeQuery.MAJ_STATUT_PAIEMENT)
                        .param("statut", "ECHOUE")
                        .param("dateConfirmation", null)
                        .param("commandeId", commandeId)
                        .update();
                log.info("Paiement {} refusé, commande {} annulée et places rendues", referencePaiement, commandeUuid);
            }
            case EN_ATTENTE -> log.info("Paiement {} toujours en attente chez le prestataire", referencePaiement);
        }
        return getByUuid(commandeUuid);
    }

    @Override
    public void expirerCommande(String commandeUuid) {
        var contexte = jdbcClient.sql(CommandeQuery.FIND_CONTEXTE_EXPIRATION)
                .param("commandeUuid", commandeUuid)
                .query((rs, rowNum) -> new Object[]{rs.getLong("commande_id"), rs.getString("statut")})
                .optional()
                .orElseThrow(() -> new ApiException("Commande inconnue: " + commandeUuid));

        Long commandeId = (Long) contexte[0];
        String statutCourant = (String) contexte[1];

        // Une commande tranchée entre-temps — le client vient de payer, ou un
        // agent l'a annulée — ne doit pas être retouchée.
        if (!"EN_ATTENTE".equals(statutCourant)) {
            log.debug("Commande {} au statut {}, expiration sans objet", commandeUuid, statutCourant);
            return;
        }

        jdbcClient.sql(CommandeQuery.ECHOUER_COMMANDE).param("commandeId", commandeId).update();
        jdbcClient.sql(CommandeQuery.ANNULER_BILLETS_BY_COMMANDE).param("commandeId", commandeId).update();
        jdbcClient.sql(CommandeQuery.MAJ_STATUT_PAIEMENT)
                .param("statut", "ECHOUE")
                .param("dateConfirmation", null)
                .param("commandeId", commandeId)
                .update();
        log.info("Commande {} expirée faute de paiement, places rendues", commandeUuid);
    }

    /** Email de l'utilisateur, vide si le service utilisateur est injoignable. */
    private String emailUtilisateur(Long userId) {
        try {
            User user = userClient.getUserById(userId);
            return user != null && user.getEmail() != null ? user.getEmail() : "";
        } catch (Exception e) {
            log.warn("Impossible de récupérer l'email utilisateur {}: {}", userId, e.getMessage());
            return "";
        }
    }

    /**
     * Notifie la confirmation d'une commande. Appelée une seule fois par
     * commande : à la création pour un règlement hors ligne, à l'encaissement
     * pour un paiement en ligne. Jamais bloquante.
     */
    private void notifierCommandeConfirmee(String numeroCommande, Offre offre, Long userId,
                                           List<Billet> billets, int nombrePassagers,
                                           BigDecimal montantPaye, String referencePaiement) {
        try {
            String billetCodes = billets.stream().map(Billet::getCodeBillet)
                    .reduce((a, b) -> a + ", " + b).orElse("");
            String passagerNoms = billets.stream().map(Billet::getNomPassager)
                    .reduce((a, b) -> a + ", " + b).orElse("");
            String passagerPhone = billets.stream().map(Billet::getTelephonePassager)
                    .filter(t -> t != null && !t.isBlank()).findFirst().orElse("");

            var event = new Event(EventType.COMMANDE_CONFIRMEE, Map.ofEntries(
                    Map.entry("numeroCommande", numeroCommande),
                    Map.entry("email", offre.getUserEmail() != null ? offre.getUserEmail() : ""),
                    Map.entry("userEmail", emailUtilisateur(userId)),
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

            CompletableFuture.runAsync(() -> {
                try {
                    kafkaTemplate.send(message);
                    log.info("Notification Kafka envoyée pour commande: {}", numeroCommande);
                } catch (Exception ex) {
                    log.error("Kafka indisponible, notification non envoyée pour: {}", numeroCommande, ex);
                }
            });
        } catch (Exception e) {
            log.error("Erreur préparation notification Kafka: {}", e.getMessage());
        }
    }

}
