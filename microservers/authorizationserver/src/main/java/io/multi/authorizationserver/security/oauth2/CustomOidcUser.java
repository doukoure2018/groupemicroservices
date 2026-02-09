package io.multi.authorizationserver.security.oauth2;

import io.multi.authorizationserver.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Custom OidcUser implementation that wraps both the OidcUser from Google
 * and our internal User entity.
 */
public class CustomOidcUser implements OidcUser {

    private final OidcUser oidcUser;
    private final User user;

    public CustomOidcUser(OidcUser oidcUser, User user) {
        this.oidcUser = oidcUser;
        this.user = user;
    }

    @Override
    public Map<String, Object> getClaims() {
        return oidcUser.getClaims();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return oidcUser.getUserInfo();
    }

    @Override
    public OidcIdToken getIdToken() {
        return oidcUser.getIdToken();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oidcUser.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = user.getRole();
        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }
        return List.of(new SimpleGrantedAuthority(role != null ? role : "ROLE_USER"));
    }

    @Override
    public String getName() {
        return user.getEmail();
    }

    public User getUser() {
        return user;
    }

    public Long getUserId() {
        return user.getUserId();
    }

    public String getUserUuid() {
        return user.getUserUuid();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public String getFirstName() {
        return user.getFirstName();
    }

    public String getLastName() {
        return user.getLastName();
    }

    public String getFullName() {
        return user.getFirstName() + " " + user.getLastName();
    }

    public String getImageUrl() {
        return user.getImageUrl();
    }

    public boolean isMfaEnabled() {
        return user.isMfa();
    }
}
