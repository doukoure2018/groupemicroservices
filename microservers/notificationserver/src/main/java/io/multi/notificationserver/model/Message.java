package io.multi.notificationserver.model;


import lombok.*;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Message {
    private Long messageId;
    private String messageUuid;
    private String conversationId;
    private String subject;
    private String message;
    private String status;
    private String senderUuid;
    private String senderFirstName;
    private String senderLastName;
    private String senderEmail;
    private String senderImageUrl;
    private String receiverUuid;
    private String receiverFirstName;
    private String receiverLastName;
    private String receiverEmail;
    private String receiverImageUrl;
    private String createdAt;
    private String updatedAt;
}
