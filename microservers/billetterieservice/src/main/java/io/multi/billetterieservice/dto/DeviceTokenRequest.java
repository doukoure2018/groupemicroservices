package io.multi.billetterieservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTokenRequest {
    @NotBlank(message = "Le token est obligatoire")
    private String token;

    @NotBlank(message = "La plateforme est obligatoire")
    private String platform; // ANDROID | IOS
}
