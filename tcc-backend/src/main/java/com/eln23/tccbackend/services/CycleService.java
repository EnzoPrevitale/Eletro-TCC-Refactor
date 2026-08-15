package com.eln23.tccbackend.services;

import com.eln23.tccbackend.dtos.filter.CycleFilterDto;
import com.eln23.tccbackend.dtos.request.CycleRequestDto;
import com.eln23.tccbackend.dtos.response.CycleResponseDto;
import com.eln23.tccbackend.entities.Cycle;
import com.eln23.tccbackend.entities.Trial;
import com.eln23.tccbackend.mappers.CycleMapper;
import com.eln23.tccbackend.repositories.CycleRepository;
import com.eln23.tccbackend.repositories.TrialRepository;
import com.eln23.tccbackend.specs.CycleSpecs;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class CycleService {

    private final CycleRepository repository;
    private final CycleMapper mapper;
    private final TrialRepository trialRepository;

    public CycleService(CycleRepository repository, CycleMapper mapper, TrialRepository trialRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.trialRepository = trialRepository;
    }

    public Page<CycleResponseDto> readFiltered(CycleFilterDto filterDto, Pageable pageable) {
        Specification<Cycle> spec = CycleSpecs.fromFilter(filterDto);
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    public Page<CycleResponseDto> readFilteredByInput(String input, Pageable pageable) {
        Specification<Cycle> spec = CycleSpecs.fromInput(input);
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    public Optional<CycleResponseDto> readById(UUID id) {
        Optional<Cycle> cycle = repository.findById(id);
        return cycle.map(mapper::toDto);
    }

    @Transactional
    public CycleResponseDto create(CycleRequestDto dto) {
        Trial trial = trialRepository.findById(dto.trialId())
                .orElseThrow(() -> new EntityNotFoundException("Trial not found with id: " + dto.trialId()));

        Cycle entity = mapper.toEntity(dto);
        entity.setTrial(trial);
        entity = repository.save(entity);
        return mapper.toDto(entity);
    }
}
