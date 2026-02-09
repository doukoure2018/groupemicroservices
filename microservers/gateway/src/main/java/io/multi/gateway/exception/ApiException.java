package io.multi.gateway.exception;

public class ApiException extends RuntimeException {
    public ApiException(String message) { super(message); }
}