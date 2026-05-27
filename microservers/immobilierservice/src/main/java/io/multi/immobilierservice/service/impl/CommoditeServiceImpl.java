package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.repository.CommoditeRepository;
import io.multi.immobilierservice.service.CommoditeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommoditeServiceImpl implements CommoditeService {

    private final CommoditeRepository commoditeRepository;

    @Override
    public List<Commodite> findAll() {
        return commoditeRepository.findAll();
    }
}
