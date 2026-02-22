package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.InAppNotification;
import io.multi.billetterieservice.query.NotificationQuery;
import io.multi.billetterieservice.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InAppNotificationServiceImpl implements InAppNotificationService {

    private final JdbcClient jdbcClient;

    @Override
    @Transactional(readOnly = true)
    public List<InAppNotification> getByUserId(Long userId, int page, int size) {
        return jdbcClient.sql(NotificationQuery.FIND_BY_USER_ID)
                .param("userId", userId)
                .param("limit", size)
                .param("offset", page * size)
                .query((rs, rowNum) -> InAppNotification.builder()
                        .notificationId(rs.getLong("notification_id"))
                        .notificationUuid(rs.getString("notification_uuid"))
                        .userId(rs.getLong("user_id"))
                        .typeNotification(rs.getString("type_notification"))
                        .categorie(rs.getString("categorie"))
                        .titre(rs.getString("titre"))
                        .message(rs.getString("message"))
                        .lue(rs.getBoolean("lue"))
                        .envoyee(rs.getBoolean("envoyee"))
                        .dateEnvoi(rs.getObject("date_envoi", OffsetDateTime.class))
                        .dateLecture(rs.getObject("date_lecture", OffsetDateTime.class))
                        .referenceId(rs.getObject("reference_id", Long.class))
                        .referenceType(rs.getString("reference_type"))
                        .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                        .build())
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public Long countUnread(Long userId) {
        return jdbcClient.sql(NotificationQuery.COUNT_UNREAD)
                .param("userId", userId)
                .query(Long.class)
                .single();
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        jdbcClient.sql(NotificationQuery.MARK_AS_READ)
                .param("notificationId", notificationId)
                .param("userId", userId)
                .update();
    }

    @Override
    public void markAllAsRead(Long userId) {
        int updated = jdbcClient.sql(NotificationQuery.MARK_ALL_AS_READ)
                .param("userId", userId)
                .update();
        log.info("Marqué {} notifications comme lues pour userId: {}", updated, userId);
    }

    @Override
    public void createNotification(Long userId, String typeNotification, String categorie,
                                    String titre, String message, boolean envoyee,
                                    Long referenceId, String referenceType) {
        jdbcClient.sql(NotificationQuery.INSERT)
                .param("userId", userId)
                .param("typeNotification", typeNotification)
                .param("categorie", categorie)
                .param("titre", titre)
                .param("message", message)
                .param("envoyee", envoyee)
                .param("referenceId", referenceId)
                .param("referenceType", referenceType)
                .query((rs, rowNum) -> rs.getLong("notification_id"))
                .single();
        log.debug("Notification in-app créée pour userId: {} - {}", userId, titre);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByReference(Long userId, Long referenceId, String referenceType, String categorie) {
        Long count = jdbcClient.sql(NotificationQuery.CHECK_EXISTS_BY_REFERENCE)
                .param("userId", userId)
                .param("referenceId", referenceId)
                .param("referenceType", referenceType)
                .param("categorie", categorie)
                .query(Long.class)
                .single();
        return count > 0;
    }
}
