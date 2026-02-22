package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.InAppNotification;

import java.util.List;

public interface InAppNotificationService {
    List<InAppNotification> getByUserId(Long userId, int page, int size);
    Long countUnread(Long userId);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    void createNotification(Long userId, String typeNotification, String categorie,
                            String titre, String message, boolean envoyee,
                            Long referenceId, String referenceType);
    boolean existsByReference(Long userId, Long referenceId, String referenceType, String categorie);
}
