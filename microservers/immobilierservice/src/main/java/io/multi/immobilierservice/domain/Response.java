package io.multi.immobilierservice.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class Response {

    private Long time;
    private Long timeStamp;
    private int code;
    private Integer statusCode;
    private String path;
    private HttpStatus httpStatus;
    private HttpStatus status;
    private String message;
    private String exception;
    private String developerMessage;
    private Map<?, ?> data;

    public Response(Long time, int code, String path, HttpStatus httpStatus, String message, String exception, Map<?, ?> data) {
        this.time = time;
        this.timeStamp = time;
        this.code = code;
        this.statusCode = code;
        this.path = path;
        this.httpStatus = httpStatus;
        this.status = httpStatus;
        this.message = message;
        this.exception = exception;
        this.developerMessage = exception;
        this.data = data;
    }

    public static Response success(String message, Map<?, ?> data, HttpStatus status, String path) {
        return Response.builder()
                .time(System.currentTimeMillis())
                .timeStamp(System.currentTimeMillis())
                .code(status.value())
                .statusCode(status.value())
                .path(path)
                .httpStatus(status)
                .status(status)
                .message(message)
                .data(data)
                .build();
    }

    public static Response error(String message, String exception, HttpStatus status, String path) {
        return Response.builder()
                .time(System.currentTimeMillis())
                .timeStamp(System.currentTimeMillis())
                .code(status.value())
                .statusCode(status.value())
                .path(path)
                .httpStatus(status)
                .status(status)
                .message(message)
                .exception(exception)
                .developerMessage(exception)
                .build();
    }
}
