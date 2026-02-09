package io.multi.authorizationserver.event;


import io.multi.authorizationserver.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.event.AbstractAuthenticationFailureEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

import static io.multi.authorizationserver.utils.UserAgentUtils.*;
import static io.multi.authorizationserver.utils.UserUtils.getUser;

@Slf4j
@Component
@AllArgsConstructor
public class ApiAuthenticationEventListener {
    private final UserService userService;
    private final HttpServletRequest request;

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        log.info("AuthenticationSuccess - {}", event);
        if(event.getAuthentication().getPrincipal() instanceof UsernamePasswordAuthenticationToken) {
            var user = getUser(event.getAuthentication());
            userService.setLastLogin(user.getUserId());
            userService.resetLoginAttempts(user.getUserUuid());
            userService.addLoginDevice(user.getUserId(), getDevice(request), getClient(request), getIpAddress(request));
        }
    }

    @EventListener
    public void onAuthenticationFailure(AbstractAuthenticationFailureEvent event) {
        log.info("AuthenticationFailure - {}", event);
        if(event.getException() instanceof BadCredentialsException) {
            var email = (String) event.getAuthentication().getPrincipal();
            userService.updateLoginAttempts(email);
        }
    }
}
