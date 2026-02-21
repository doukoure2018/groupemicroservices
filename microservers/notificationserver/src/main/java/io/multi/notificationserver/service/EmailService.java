package io.multi.notificationserver.service;


public interface EmailService {
    void sendNewAccountHtmlEmail(String name, String to, String token);
    void sendPasswordResetHtmlEmail(String name, String to, String token);
    void sendNewTicketHtmlEmail(String name, String email, String ticketTitle, String ticketNumber, String priority);
    void sendNewFilesHtmlEmail(String name, String email, String files, String ticketTitle, String ticketNumber, String priority, String date);
    void sendBookingConfirmationEmail(String name, String email, String numeroCommande, String trajet, String dateDepart, String heureDepart, String nombrePlaces, String montantPaye, String billetCodes);
    void sendBookingCancellationEmail(String name, String email, String numeroCommande, String trajet, String dateDepart, String heureDepart, String nombrePlaces, String montantPaye);
}
