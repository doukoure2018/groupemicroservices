package io.multi.notificationserver.service;


public interface EmailService {
    void sendNewAccountHtmlEmail(String name, String to, String token);
    void sendPasswordResetHtmlEmail(String name, String to, String token);
    void sendNewTicketHtmlEmail(String name, String email, String ticketTitle, String ticketNumber, String priority);
    void sendNewFilesHtmlEmail(String name, String email, String files, String ticketTitle, String ticketNumber, String priority, String date);
}
