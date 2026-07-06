package io.multi.notificationserver.event.immo;

/**
 * Enum mirror de io.multi.immobilierservice.event.EventType. Isolé du domaine
 * billetterie/auth (Notification existante) — ce package gère uniquement les
 * events publiés par le module immobilier sur IMMO_NOTIFICATION_TOPIC.
 *
 * <p>TODO : dupliqué de immobilierservice/event/EventType.java. À extraire dans
 * le module {@code clients/} partagé quand on consolidera (cf. note Phase 11).
 */
public enum ImmoEventType {
    IMMO_CONTACT_RECU,
    IMMO_VISITE_DEMANDEE,
    IMMO_VISITE_CONFIRMEE,
    IMMO_ANNONCE_VALIDEE,
    IMMO_ANNONCE_REJETEE,
    IMMO_RAPPEL_EXPIRATION,
    IMMO_SIGNALEMENT_SEUIL,
    IMMO_AGENCE_APPROUVEE,
    IMMO_AGENCE_REJETEE
}
