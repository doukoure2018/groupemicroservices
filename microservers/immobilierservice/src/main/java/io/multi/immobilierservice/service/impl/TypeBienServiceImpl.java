package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.TypeBien;
import io.multi.immobilierservice.repository.TypeBienRepository;
import io.multi.immobilierservice.service.TypeBienService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TypeBienServiceImpl implements TypeBienService {

    private final TypeBienRepository typeBienRepository;

    @Override
    public List<TypeBien> findAll() {
        return typeBienRepository.findAll();
    }
}
