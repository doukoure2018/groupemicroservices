package io.multi.gateway.domain;

import org.springframework.http.HttpStatus;

import java.util.Map;

public record Response (String time, int code, String path, HttpStatus httpStatus, String message, String exception, Map<?, ?> data) {}
