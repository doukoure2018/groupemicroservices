package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.PreferencesNotification;
import io.multi.immobilierservice.dto.PreferencesNotificationUpdateRequest;
import io.multi.immobilierservice.repository.PreferencesNotificationRepository;
import io.multi.immobilierservice.service.PreferencesNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreferencesNotificationServiceImpl implements PreferencesNotificationService {

    private final PreferencesNotificationRepository repository;

    @Override
    public PreferencesNotification getOrDefaults(Long userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> PreferencesNotification.defaultsFor(userId));
    }

    @Override
    @Transactional
    public PreferencesNotification update(Long userId, PreferencesNotificationUpdateRequest req) {
        PreferencesNotification updated = repository.upsert(
                userId, req.getContactSms(), req.getVisiteConfirmeeSms());
        log.info("Préférences notification user {} mises à jour : contactSms={} visiteConfirmeeSms={}",
                userId, updated.isContactSms(), updated.isVisiteConfirmeeSms());
        return updated;
    }
}
