package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.query.DeviceTokenQuery;
import io.multi.billetterieservice.service.DeviceTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DeviceTokenServiceImpl implements DeviceTokenService {

    private final JdbcClient jdbcClient;

    @Override
    public void register(Long userId, String token, String platform) {
        jdbcClient.sql(DeviceTokenQuery.UPSERT)
                .param("userId", userId)
                .param("token", token)
                .param("platform", platform)
                .update();
        log.debug("Device token enregistré pour userId: {} ({})", userId, platform);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getTokensByUser(Long userId) {
        return jdbcClient.sql(DeviceTokenQuery.FIND_TOKENS_BY_USER)
                .param("userId", userId)
                .query(String.class)
                .list();
    }

    @Override
    public void delete(String token) {
        jdbcClient.sql(DeviceTokenQuery.DELETE_BY_TOKEN)
                .param("token", token)
                .update();
    }
}
