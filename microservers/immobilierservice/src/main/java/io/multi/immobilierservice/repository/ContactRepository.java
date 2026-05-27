package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Contact;

import java.util.List;
import java.util.Optional;

public interface ContactRepository {

    Contact save(Contact contact);

    Optional<Contact> findByUuid(String contactUuid);

    /** Contacts reçus par un vendeur (toutes ses propriétés). */
    List<Contact> findRecusByVendeur(Long vendeurUserId, int limit, int offset);

    long countRecusByVendeur(Long vendeurUserId);

    /** Contacts envoyés par un user (côté acheteur). */
    List<Contact> findEnvoyesByUser(Long userId, int limit, int offset);

    long countEnvoyesByUser(Long userId);

    Optional<Contact> markVu(String contactUuid);

    /** user_id du vendeur (owner) — sert au check d'autorisation pour markVu. */
    Optional<Long> findVendeurUserId(String contactUuid);
}
