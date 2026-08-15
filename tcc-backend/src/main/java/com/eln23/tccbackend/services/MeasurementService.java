package com.eln23.tccbackend.services;

import com.eln23.tccbackend.dtos.filter.MeasurementFilterDto;
import com.eln23.tccbackend.dtos.request.MeasurementRequestDto;
import com.eln23.tccbackend.dtos.response.MeasurementResponseDto;
import com.eln23.tccbackend.entities.Cycle;
import com.eln23.tccbackend.entities.Measurement;
import com.eln23.tccbackend.mappers.MeasurementMapper;
import com.eln23.tccbackend.repositories.CycleRepository;
import com.eln23.tccbackend.repositories.MeasurementRepository;
import com.eln23.tccbackend.specs.MeasurementSpecs;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class MeasurementService {

    private final MeasurementRepository repository;
    private final MeasurementMapper mapper;
    private final CycleRepository cycleRepository;

    public MeasurementService(MeasurementRepository repository, MeasurementMapper mapper, CycleRepository cycleRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.cycleRepository = cycleRepository;
    }

    public Page<MeasurementResponseDto> readFiltered(MeasurementFilterDto filterDto, Pageable pageable) {
        Specification<Measurement> spec = MeasurementSpecs.fromFilter(filterDto);
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    public Page<MeasurementResponseDto> readFilteredByInput(String input, Pageable pageable) {
        Specification<Measurement> spec = MeasurementSpecs.fromInput(input);
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    public Optional<MeasurementResponseDto> readById(UUID id) {
        Optional<Measurement> measurement = repository.findById(id);
        return measurement.map(mapper::toDto);
    }

    @Transactional
    public MeasurementResponseDto create(MeasurementRequestDto dto) {
        Cycle cycle = cycleRepository.findById(dto.cycleId())
                .orElseThrow(() -> new EntityNotFoundException("Cycle not found with id: " + dto.cycleId()));

        Measurement entity = mapper.toEntity(dto);
        entity.setCycle(cycle);
        entity = repository.save(entity);
        return mapper.toDto(entity);
    }
}
