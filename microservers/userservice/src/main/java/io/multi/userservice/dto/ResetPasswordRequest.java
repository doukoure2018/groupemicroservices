package io.multi.userservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResetPasswordRequest {

    @NotEmpty(message = "UserUuid cannot be empty or null")
    private String userUuid;

    @NotEmpty(message = "Token cannot be empty or null")
    private String token;

    @NotEmpty(message = "New password cannot be empty or null")
    private String password;

    @NotEmpty(message = "Confirmed Password cannot be empty or null")
    private String confirmPassword;
}

