package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.TypeBien;

import java.util.List;
import java.util.Optional;

public interface TypeBienRepository {

    List<TypeBien> findAll();

    Optional<TypeBien> findByCode(String code);
}
