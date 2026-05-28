package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.PreferencesNotification;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class PreferencesNotificationRowMapper implements RowMapper<PreferencesNotification> {

    @Override
    public PreferencesNotification mapRow(ResultSet rs, int rowNum) throws SQLException {
        return PreferencesNotification.builder()
                .userId(rs.getLong("user_id"))
                .contactSms(rs.getBoolean("contact_sms"))
                .visiteConfirmeeSms(rs.getBoolean("visite_confirmee_sms"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .build();
    }
}
