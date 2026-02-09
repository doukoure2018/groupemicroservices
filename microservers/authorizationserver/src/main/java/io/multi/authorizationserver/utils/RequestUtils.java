package io.multi.authorizationserver.utils;


import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

public class RequestUtils {

    // 1 related problem
    public static String getMessage(HttpServletRequest request) {
        var status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if(null != status) {
            int statusCode = Integer.parseInt(status.toString());
            if(statusCode == HttpStatus.NOT_FOUND.value()) {
                return String.format("%s - Not Found error", statusCode);
            }
            if(statusCode == HttpStatus.INTERNAL_SERVER_ERROR.value()) {
                return String.format("%s - Internal server error", statusCode);
            }
            if(statusCode == HttpStatus.FORBIDDEN.value()) {
                return String.format("%s - Forbidden error", statusCode);
            }
        }
        return "An error occurred";
    }
}