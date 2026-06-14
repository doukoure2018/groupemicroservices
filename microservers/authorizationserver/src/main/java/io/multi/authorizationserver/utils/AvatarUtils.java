package io.multi.authorizationserver.utils;

/**
 * Helpers avatar partagés entre les chemins de login Google (web OIDC
 * {@code CustomOidcUserService} et mobile {@code MobileAuthController}).
 */
public final class AvatarUtils {

    private AvatarUtils() {
    }

    /**
     * Avatar par défaut posé par le DEFAULT de la colonne {@code users.image_url}
     * (cf migration V1). image_url n'étant donc JAMAIS NULL, ce placeholder doit
     * être considéré comme "remplaçable" pour pouvoir capter la photo Google.
     * Le SQL reste la source de vérité ; cette constante en est le miroir Java.
     */
    public static final String DEFAULT_AVATAR_URL =
            "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    /**
     * Vrai si l'avatar courant est vide ou correspond au placeholder par défaut
     * (test robuste au éventuel suffixe {@code ?timestamp}), donc remplaçable par
     * la photo Google. Faux si l'user a un avatar uploadé custom (à ne pas écraser).
     */
    public static boolean isReplaceable(String current) {
        return current == null || current.isBlank()
                || current.contains("flaticon") || current.contains("149071");
    }
}
