package io.multi.userservice.model;

import lombok.*;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Credential {

    private Long credentialId;
    private String credentialUuid;
    private String password;
    private String createdAt;
    private String updatedAt;
}

