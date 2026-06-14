package io.multi.notificationserver.utils;


import java.util.UUID;
import java.util.function.Supplier;

public class EmailUtils {

    public static Supplier<String> randomUUID = () -> UUID.randomUUID().toString();

    public static String getVerificationUrl(String host, String token) {
        // Phase 2 : lien unifié vers le web-bridge mobile. Sur mobile il redirige
        // vers sira:// (auto-login app) ; sur desktop il vérifie + affiche un
        // message. L'ancienne page /auth/verify/account reste disponible.
        return host + "/auth/verify/mobile?token=" + token;
    }

    public static String getResetPasswordUrl(String host, String token) {
        return host + "/auth/verify/password?token=" + token;
    }

    public static String getTicketUrl(String host, String ticketNumber) {
        return host + "/tickets/" + ticketNumber;
    }
}
