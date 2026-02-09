package io.multi.authorizationserver.security;

import io.micrometer.common.util.StringUtils;
import io.multi.authorizationserver.exception.ApiException;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

import static org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated;
import static org.springframework.security.core.authority.AuthorityUtils.commaSeparatedStringToAuthorityList;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserAuthenticationProvider implements AuthenticationProvider {
    private final UserService userService;
    private final BCryptPasswordEncoder encoder;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String email = authentication.getName();
        String password = authentication.getCredentials().toString();

        log.debug("Attempting to authenticate user: {}", email);
        log.debug("Password present: {}", !StringUtils.isEmpty(password));
        try {
            var user = userService.getUserByEmail((String) authentication.getPrincipal());
            validateUser.accept(user);
            if(encoder.matches((String) authentication.getCredentials(), user.getPassword())) {
                return authenticated(user, "[PROTECTED]", commaSeparatedStringToAuthorityList(user.getRole() + "," + user.getAuthorities()));
            } else throw new BadCredentialsException("Incorrect email/password. Please try again.");
        } catch (BadCredentialsException | ApiException | LockedException | CredentialsExpiredException |
                 DisabledException exception) {
            throw new ApiException(exception.getMessage());
        } catch (Exception exception) {
            throw new ApiException("Unable to authenticate. Please try again.");
        }
    }

    @Override
    public boolean supports(Class<?> authenticationType) {
        return authenticationType.isAssignableFrom(UsernamePasswordAuthenticationToken.class);
    }

    private final Consumer<User> validateUser = user -> {
        if(!user.isAccountNonLocked() || user.getLoginAttempts() >= 5) {
            throw new LockedException(String.format(user.getLoginAttempts() > 0 ? "Account currently locked after %s failed login attempts" : "Account currently locked", user.getLoginAttempts()));
        }

        if(!user.isEnabled()) {
            throw new DisabledException("your Account is currently disabled");
        }

        if(!user.isAccountNonExpired()) {
            throw new DisabledException("your account has expired. Please contact your administrateur");
        }
    };
}
