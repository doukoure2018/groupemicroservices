package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Commodite;

import java.util.List;
import java.util.Optional;

public interface CommoditeRepository {

    List<Commodite> findAll();

    Optional<Commodite> findByCode(String code);

    List<Commodite> findByCodes(List<String> codes);
}
