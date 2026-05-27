package io.multi.immobilierservice.exception;

/**
 * Action interdite pour ce user authentifié sur une ressource dont l'existence
 * est PUBLIQUE (ex : tentative de modifier une propriété publiée d'autrui,
 * d'éditer un profil vendeur d'autrui, ou action réservée admin).
 *
 * Le client est informé que la ressource existe — il sait qu'il n'a juste
 * pas l'autorisation. Pour les ressources PRIVÉES (brouillon, message reçu...),
 * utiliser plutôt {@link NotFoundException} pour ne pas confirmer leur existence.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
