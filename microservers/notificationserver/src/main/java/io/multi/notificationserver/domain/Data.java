package io.multi.notificationserver.domain;

import lombok.*;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Data {

    private String name;
    private String email;
    private String token;
    private String ticketTitle;
    private String ticketNumber;
    private String priority;
    private String comment;
    private String date;
    private String files;
}