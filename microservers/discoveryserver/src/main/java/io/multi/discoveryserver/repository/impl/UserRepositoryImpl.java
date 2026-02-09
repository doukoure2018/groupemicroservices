package io.multi.discoveryserver.repository.impl;


import io.multi.discoveryserver.exception.ApiException;
import io.multi.discoveryserver.model.User;
import io.multi.discoveryserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import static io.multi.discoveryserver.query.UserQuery.SELECT_USER_BY_USERNAME_QUERY;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryImpl implements UserRepository {

    private final JdbcClient jdbcClient;

    @Override
    public User getUserUsername(String username) {
        try {
            return jdbcClient.sql(SELECT_USER_BY_USERNAME_QUERY).param("username",username).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by username");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }
}

