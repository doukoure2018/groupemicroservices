package io.multi.notificationserver.repository.impl;


import io.multi.notificationserver.exception.ApiException;
import io.multi.notificationserver.model.Message;
import io.multi.notificationserver.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import static io.multi.notificationserver.query.MessageQuery.*;
import static io.multi.notificationserver.utils.EmailUtils.randomUUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationRepositoryImpl implements NotificationRepository {
    private final JdbcClient jdbc;

    @Override
    public Message sendMessage(String fromUserUuid, String toEmail, String subject, String message) {
        try {
            return jdbc.sql(CREATE_MESSAGE_FUNCTION).params(Map.of("messageUuid",randomUUID.get(), "fromUserUuid",fromUserUuid,"toEmail",toEmail,"subject",subject,"message",message,"conversationId", conversationExist(fromUserUuid,toEmail) ? getConversationId(fromUserUuid,toEmail) : randomUUID.get())).query(Message.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", toEmail));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }

    @Override
    public List<Message> getMessages(String userUuid) {
        try {
            return jdbc.sql(SELECT_MESSAGES_QUERY).param("userUuid",userUuid).query(Message.class).list();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", userUuid));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }

    @Override
    public List<Message> getConversations(String userUuid, String conversationId) {
        try {
            return jdbc.sql(SELECT_MESSAGES_BY_CONVERSATION_ID_QUERY).params(Map.of("userUuid",userUuid,"conversationId",conversationId)).query(Message.class).list();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", userUuid));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }

    @Override
    public String getMessageStatus(String userUuid, Long messageId) {
        try {
            return jdbc.sql(SELECT_MESSAGES_STATUS_QUERY).params(Map.of("userUuid",userUuid,"messageId",messageId)).query(String.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", userUuid));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }

    @Override
    public String udpateMessageStatus(String userUuid, Long messageId, String status) {
        try {
            jdbc.sql(UPDATE_MESSAGES_STATUS_QUERY).params(Map.of("userUuid",userUuid,"messageId",messageId,"status",status)).update();
            return status;
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", userUuid));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }

    private Boolean conversationExist(String userUuid,String toEmail)
    {
        try {
            var count = jdbc.sql(SELECT_MESSAGE_COUNT_QUERY).params(Map.of("userUuid",userUuid,"toEmail",toEmail)).query(Integer.class).single();
            return count > 0;
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", userUuid));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }

    private String getConversationId(String userUuid, String toEmail){
        try {
            return jdbc.sql(SELECT_CONVERSATION_ID_QUERY).params(Map.of("userUuid",userUuid,"toEmail",toEmail)).query(String.class).single();

        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw new ApiException(String.format("No User found by Uuid %s", userUuid));
        }catch (Exception exception){
            log.error(exception.getMessage());
            throw new ApiException("An error occurred. Please try again");
        }
    }
}
