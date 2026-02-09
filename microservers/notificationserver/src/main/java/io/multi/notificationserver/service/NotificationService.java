package io.multi.notificationserver.service;

import io.multi.notificationserver.model.Message;

import java.util.List;

public interface NotificationService {

    Message sendModel(String fromUserUuid, String toEmail, String subject, String message);
    List<Message> getMessages(String userUuid);

    List<Message> getConversations(String userUuid, String conversationId);

}
