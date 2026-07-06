package io.multi.immobilierservice.event;

/**
 * Types d'événements Kafka publiés par le module immobilier vers le topic NOTIFICATION_TOPIC.
 *
 * <p>Préfixe IMMO_ retenu pour distinguer sans ambiguïté des events billetterie
 * (COMMANDE_CONFIRMEE, BILLET_VALIDE…) qui partagent le même topic.
 *
 * <p>TODO dette technique : la classe Event et la classe Notification de ce package
 * sont dupliquées depuis billetterieservice/event/. À extraire dans le module
 * {@code clients/} (où vit déjà UserClient Feign partagé) quand un 3e producteur
 * apparaîtra, ou avant la 1re prod si on veut consolider plus tôt.
 */
public enum EventType {
    IMMO_CONTACT_RECU,           // visiteur contacte vendeur → email vendeur
    IMMO_VISITE_DEMANDEE,        // demande de visite → email vendeur
    IMMO_VISITE_CONFIRMEE,       // vendeur confirme visite → email visiteur
    IMMO_ANNONCE_VALIDEE,        // admin valide annonce → email propriétaire
    IMMO_ANNONCE_REJETEE,        // admin rejette annonce → email propriétaire
    IMMO_RAPPEL_EXPIRATION,      // job J-7 : annonce expire bientôt → email propriétaire
    IMMO_SIGNALEMENT_SEUIL,      // 3e signalement distinct sur une annonce → email admin
    IMMO_AGENCE_APPROUVEE,       // conformité approuve le dossier agence → email agence
    IMMO_AGENCE_REJETEE          // conformité rejette le dossier agence (motif) → email agence
}
