package io.multi.notificationserver.service;

public interface SmsService {
    boolean sendSms(String phoneNumber, String message);
    void sendBookingConfirmationSms(String phone, String name, String numeroCommande,
                                     String trajet, String dateDepart, String heureDepart,
                                     String nombrePlaces, String montantPaye, String billetCodes);
    void sendBookingCancellationSms(String phone, String name, String numeroCommande,
                                     String trajet, String dateDepart, String montantPaye);
    void sendDepartureReminderSms(String phone, String name, String trajet, String dateDepart, String heureDepart, String pointRendezVous);
}
