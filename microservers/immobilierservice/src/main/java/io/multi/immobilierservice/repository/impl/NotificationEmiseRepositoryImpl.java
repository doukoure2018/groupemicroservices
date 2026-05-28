package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.repository.NotificationEmiseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class NotificationEmiseRepositoryImpl implements NotificationEmiseRepository {

    private final JdbcClient jdbcClient;

    @Override
    public boolean existsByReference(String reference) {
        return jdbcClient.sql("""
                SELECT EXISTS (SELECT 1 FROM immo_notification_emise WHERE reference = :reference)
                """).param("reference", reference).query(Boolean.class).single();
    }

    @Override
    public void insert(String reference, String eventType) {
        jdbcClient.sql("""
                INSERT INTO immo_notification_emise (reference, event_type)
                VALUES (:reference, :eventType)
                """)
                .param("reference", reference)
                .param("eventType", eventType)
                .update();
    }
}
