package io.multi.immobilierservice.exception;

/**
 * Ressource introuvable OU privée à un tiers.
 *
 * <p>Utilisée à dessein pour les ressources PRIVÉES (brouillon, messages reçus,
 * invitations destinées à autrui) afin de ne pas confirmer leur existence à un
 * attaquant — un 403 dans ce contexte serait une fuite d'information.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
