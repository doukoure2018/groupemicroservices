package io.multi.userservice.model;

import lombok.*;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Role {

    private Long role_id;
    private String authority;
    private String name;
}

