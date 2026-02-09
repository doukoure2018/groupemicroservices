package io.multi.discoveryserver.repository;

import io.multi.discoveryserver.model.User;

public interface UserRepository {

    User getUserUsername(String username);
}
