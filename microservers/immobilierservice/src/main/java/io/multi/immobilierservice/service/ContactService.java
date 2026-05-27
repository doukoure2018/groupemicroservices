package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.dto.ContactCreateRequest;
import io.multi.immobilierservice.dto.ContactView;

import java.util.List;

public interface ContactService {

    /**
     * Crée une demande de contact sur une propriété. Les coordonnées du demandeur
     * (nom/téléphone/email) sont récupérées <b>via UserClient</b> et stockées en
     * snapshot dans la table (pas via le DTO — voir {@link ContactCreateRequest}).
     */
    Contact creer(String proprieteUuid, ContactCreateRequest request, Long userId);

    /**
     * Contacts reçus par le vendeur connecté. Enrichit chaque contact avec les
     * coordonnées <b>actuelles</b> du demandeur (re-fetch Feign) pour permettre
     * un appel/email avec ses infos à jour. Snapshot conservé pour fallback.
     */
    List<ContactView> findMesContactsRecus(Long vendeurUserId, int limit, int offset);

    long countMesContactsRecus(Long vendeurUserId);

    /** Contacts envoyés par l'utilisateur connecté (côté acheteur). Snapshot only. */
    List<Contact> findMesContactsEnvoyes(Long userId, int limit, int offset);

    long countMesContactsEnvoyes(Long userId);

    /** Marque un contact comme "vu par vendeur" — seul le propriétaire du bien peut le faire. */
    Contact marquerVu(String contactUuid, Long requesterUserId);
}
