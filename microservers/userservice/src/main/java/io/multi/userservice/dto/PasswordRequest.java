package io.multi.userservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class PasswordRequest {

    @NotEmpty(message = "Password cannot be empty or null")
    private String currentPassword;

    @NotEmpty(message = "New password cannot be empty or null")
    private String newPassword;

    @NotEmpty(message = "Confirmed Password cannot be empty or null")
    private String confirmedPassword;
}