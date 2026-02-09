package io.multi.userservice.model;

import lombok.*;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Device {

    private Long deviceId;
    private Long userId;
    private String device;
    private String client;
    private String ipAddress;
    private String createdAt;
    private String updatedAt;

}
