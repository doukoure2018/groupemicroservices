package io.multi.notificationserver.service.impl;


import io.multi.notificationserver.model.Message;
import io.multi.notificationserver.repository.NotificationRepository;
import io.multi.notificationserver.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public Message sendModel(String fromUserUuid, String toEmail, String subject, String message) {
        return notificationRepository.sendMessage(fromUserUuid,toEmail,subject,message);
    }

    @Override
    public List<Message> getMessages(String userUuid) {
        var messages = notificationRepository.getMessages(userUuid);
        messages.forEach(message ->
                message.setStatus(
                        notificationRepository.getMessageStatus(Objects.equals(userUuid, message.getSenderUuid()) ? message.getSenderUuid() : message.getReceiverUuid(), message.getMessageId())
                ));
        return messages;
    }

    @Override
    public List<Message> getConversations(String userUuid, String conversationId) {
        var messages = notificationRepository.getConversations(userUuid, conversationId);
        messages.forEach(message ->
                message.setStatus(
                        notificationRepository.udpateMessageStatus(userUuid, message.getMessageId(), "READ")
                ));
        return messages;
    }
}
