package io.multi.notificationserver.service;

public interface SmsService {

    /** Limite GSM-7 standard pour un SMS unique (sinon concaténé = 2× prix Orange). */
    int SMS_MAX_LENGTH = 160;

    /**
     * Filet de sécurité : tronque tout message > {@link #SMS_MAX_LENGTH} en
     * gardant les 157 premiers chars + "...". Les messages immo (Phase 12)
     * sont rédigés courts dès le départ — cette troncature ne doit JAMAIS
     * s'activer en pratique. Si elle s'active, le log WARN appellera à
     * raccourcir la rédaction.
     */
    static String truncate160(String message) {
        if (message == null) return "";
        if (message.length() <= SMS_MAX_LENGTH) return message;
        return message.substring(0, SMS_MAX_LENGTH - 3) + "...";
    }

    boolean sendSms(String phoneNumber, String message);
    void sendBookingConfirmationSms(String phone, String name, String numeroCommande,
                                     String trajet, String dateDepart, String heureDepart,
                                     String nombrePlaces, String montantPaye, String billetCodes);
    void sendBookingCancellationSms(String phone, String name, String numeroCommande,
                                     String trajet, String dateDepart, String montantPaye);
    void sendDepartureReminderSms(String phone, String name, String trajet, String dateDepart, String heureDepart, String pointRendezVous);
    void sendRemplissageSms(String phone, String name, String trajet, String dateDepart, String heureDepart, String niveauRemplissage);
    void sendBilletValideSms(String phone, String name, String codeBillet, String trajet, String dateDepart);
}
