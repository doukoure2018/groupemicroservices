package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Billet;

public interface BilletService {
    Billet validateBillet(String codeBillet, Long validePar);
}
