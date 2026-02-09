package io.multi.notificationserver.service.impl;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import io.multi.notificationserver.exception.ApiException;
import io.multi.notificationserver.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.util.Map;

import static io.multi.notificationserver.utils.EmailUtils.getResetPasswordUrl;
import static io.multi.notificationserver.utils.EmailUtils.getVerificationUrl;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    public static final String NEW_USER_ACCOUNT_VERIFICATION = "New Account Verification";
    public static final String ACCOUNT_VERIFICATION_TEMPLATE = "newaccount";
    public static final String PASSWORD_RESET_TEMPLATE = "resetpassword";
    public static final String PASSWORD_RESET_REQUEST = "Reset Password Request";
    public static final String NEW_TICKET_TEMPLATE = "newticket";
    public static final String NEW_COMMENT_TEMPLATE = "newcomment";
    public static final String NEW_FILE_TEMPLATE = "newfile";
    public static final String NEW_TICKET_REQUEST = "New Support Ticket";

    public static final String STOCK_VALIDATION_TEMPLATE = "stock_validation";
    public static final String STOCK_REJECTION_TEMPLATE = "stock_rejection";

    private final TemplateEngine templateEngine;

    @Value("${spring.sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${spring.sendgrid.from.email}")
    private String fromEmail;

    @Value("${spring.sendgrid.from.name}")
    private String fromName;

    @Value("${verify.email.host}")
    private String host;

    @Override
    @Async
    public void sendNewAccountHtmlEmail(String name, String to, String token) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "url", getVerificationUrl(host, token)
            ));
            var htmlContent = templateEngine.process(ACCOUNT_VERIFICATION_TEMPLATE, context);

            sendEmail(to, NEW_USER_ACCOUNT_VERIFICATION, htmlContent);
            log.info("Account verification email sent to: {}", to);
        } catch (Exception exception) {
            log.error("Error sending account verification email: {}", exception.getMessage(), exception);
            throw new ApiException("Unable to send email");
        }
    }

    @Override
    @Async
    public void sendPasswordResetHtmlEmail(String name, String to, String token) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "url", getResetPasswordUrl(host, token)
            ));
            var htmlContent = templateEngine.process(PASSWORD_RESET_TEMPLATE, context);

            sendEmail(to, PASSWORD_RESET_REQUEST, htmlContent);
            log.info("Password reset email sent to: {}", to);
        } catch (Exception exception) {
            log.error("Error sending password reset email: {}", exception.getMessage(), exception);
            throw new ApiException("Unable to send email");
        }
    }




    @Override
    public void sendNewTicketHtmlEmail(String name, String email, String ticketTitle, String ticketNumber, String priority) {
        // TODO: Implement when needed
    }

    @Override
    public void sendNewFilesHtmlEmail(String name, String email, String files, String ticketTitle, String ticketNumber, String priority, String date) {
        // TODO: Implement when needed
    }

    /**
     * Core method to send email using SendGrid
     */
    private void sendEmail(String toEmail, String subject, String htmlContent) {
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to {}. Status: {}", toEmail, response.getStatusCode());
            } else {
                log.error("Failed to send email to {}. Status: {}, Body: {}",
                        toEmail, response.getStatusCode(), response.getBody());
                throw new ApiException("Failed to send email. Status: " + response.getStatusCode());
            }
        } catch (IOException ex) {
            log.error("Error calling SendGrid API: {}", ex.getMessage(), ex);
            throw new ApiException("Failed to send email via SendGrid");
        }
    }
}