package io.multi.immobilierservice.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import io.multi.immobilierservice.domain.Response;
import io.multi.immobilierservice.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.*;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;

import static java.util.Collections.emptyMap;
import static org.apache.commons.lang.exception.ExceptionUtils.getRootCauseMessage;
import static org.apache.logging.log4j.util.Strings.EMPTY;
import static org.springframework.http.HttpStatus.*;
import static org.springframework.util.MimeTypeUtils.APPLICATION_JSON_VALUE;

public class RequestUtils {

    private static final BiConsumer<HttpServletResponse, Response> writeResponse = (servletResponse, response) -> {
        try {
            var outputStream = servletResponse.getOutputStream();
            new ObjectMapper().writeValue(outputStream, response);
            outputStream.flush();
        } catch (Exception exception) {
            throw new ApiException(exception.getMessage());
        }
    };

    public static void handleErrorResponse(HttpServletRequest request, HttpServletResponse response, Exception exception) {
        if (exception instanceof AccessDeniedException) {
            writeResponse.accept(response, getErrorResponse(request, response, exception, FORBIDDEN));
        } else if (exception instanceof InvalidBearerTokenException) {
            writeResponse.accept(response, getErrorResponse(request, response, exception, UNAUTHORIZED));
        } else if (exception instanceof InsufficientAuthenticationException) {
            writeResponse.accept(response, getErrorResponse(request, response, exception, UNAUTHORIZED));
        } else if (exception instanceof MismatchedInputException) {
            writeResponse.accept(response, getErrorResponse(request, response, exception, BAD_REQUEST));
        } else if (exception instanceof DisabledException
                || exception instanceof LockedException
                || exception instanceof BadCredentialsException
                || exception instanceof CredentialsExpiredException
                || exception instanceof ApiException) {
            writeResponse.accept(response, getErrorResponse(request, response, exception, BAD_REQUEST));
        } else {
            writeResponse.accept(response, getErrorResponse(request, response, exception, INTERNAL_SERVER_ERROR));
        }
    }

    public static Response getResponse(HttpServletRequest request, Map<?, ?> data, String message, HttpStatus status) {
        return new Response(
                System.currentTimeMillis(),
                status.value(),
                request.getRequestURI(),
                status,
                message,
                EMPTY,
                data
        );
    }

    private static final BiFunction<Exception, HttpStatus, String> errorReason = (exception, httpStatus) -> {
        if (httpStatus.isSameCodeAs(FORBIDDEN)) {
            return "You don't have enough permission";
        }
        if (httpStatus.isSameCodeAs(UNAUTHORIZED)) {
            return exception.getMessage() != null && exception.getMessage().contains("Jwt expired at")
                    ? "Your session has expired"
                    : "You are not logged in";
        }
        if (exception instanceof DisabledException
                || exception instanceof LockedException
                || exception instanceof BadCredentialsException
                || exception instanceof CredentialsExpiredException
                || exception instanceof ApiException) {
            return exception.getMessage();
        }
        if (httpStatus.is5xxServerError()) {
            return "An internal server error occurred";
        }
        return "An error occurred. Please try again.";
    };

    private static Response getErrorResponse(HttpServletRequest request, HttpServletResponse response, Exception exception, HttpStatus status) {
        response.setContentType(APPLICATION_JSON_VALUE);
        response.setStatus(status.value());
        return new Response(
                System.currentTimeMillis(),
                status.value(),
                request.getRequestURI(),
                HttpStatus.valueOf(status.value()),
                errorReason.apply(exception, status),
                getRootCauseMessage(exception),
                emptyMap()
        );
    }
}
