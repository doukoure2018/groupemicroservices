package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.repository.UserLookupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserLookupRepositoryImpl implements UserLookupRepository {

    private final JdbcClient jdbcClient;

    @Override
    public Optional<UserBasic> findById(Long userId) {
        return jdbcClient.sql("""
                SELECT user_id, email, username, first_name, last_name, phone
                FROM users WHERE user_id = :userId
                """)
                .param("userId", userId)
                .query((rs, n) -> new UserBasic(
                        rs.getLong("user_id"),
                        rs.getString("email"),
                        rs.getString("username"),
                        rs.getString("first_name"),
                        rs.getString("last_name"),
                        rs.getString("phone")))
                .optional();
    }
}
