package io.multi.clients;

import io.multi.clients.domain.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@FeignClient("userservice")
public interface UserClient {

    @GetMapping(path = "/user/getUser/{userId}")
    User getUserById(
            @PathVariable(name = "userId") Long userId);

    @GetMapping("/user/getUser/uuid/{uuid}")
    User getUserByUuid(@PathVariable(name ="uuid" ) String uuid);
}
