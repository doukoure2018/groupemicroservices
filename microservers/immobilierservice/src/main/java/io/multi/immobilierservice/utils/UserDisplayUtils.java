package io.multi.immobilierservice.utils;

import io.multi.clients.domain.User;

public final class UserDisplayUtils {

    private UserDisplayUtils() {}

    public static String nomComplet(User u) {
        if (u == null) return "Utilisateur";
        String n = ((u.getFirstName() != null ? u.getFirstName() : "")
                + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
        return n.isBlank() ? (u.getUsername() != null ? u.getUsername() : "Utilisateur") : n;
    }
}
