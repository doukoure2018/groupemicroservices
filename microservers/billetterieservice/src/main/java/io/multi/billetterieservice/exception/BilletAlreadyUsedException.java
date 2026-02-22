package io.multi.billetterieservice.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public class BilletAlreadyUsedException extends RuntimeException {
    private final Map<String, Object> billetInfo;

    public BilletAlreadyUsedException(String message, Map<String, Object> billetInfo) {
        super(message);
        this.billetInfo = billetInfo;
    }
}
