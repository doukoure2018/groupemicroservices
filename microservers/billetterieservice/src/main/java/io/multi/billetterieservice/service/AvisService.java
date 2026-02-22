package io.multi.billetterieservice.service;

import io.multi.billetterieservice.dto.AvisRequest;

public interface AvisService {
    void createAvis(AvisRequest request, Long userId);
}
