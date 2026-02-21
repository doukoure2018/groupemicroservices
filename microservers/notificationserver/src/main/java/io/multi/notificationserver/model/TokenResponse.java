package io.multi.notificationserver.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {
    private String token;
    private Long status;
    private Long expiresIn;
    private String tokenType;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;

    public boolean isSuccess() {
        return status != null && status == 200 && token != null && !token.isEmpty();
    }
}
