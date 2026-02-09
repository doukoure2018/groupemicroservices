package io.multi.userservice.service;

import io.multi.userservice.model.TokenResponse;

public interface OrangeSmsService {

    TokenResponse getOAuthToken();

    void sendSms(String token, String recipient, String senderName, String message);

    int getSmsBalance(String token);
}
