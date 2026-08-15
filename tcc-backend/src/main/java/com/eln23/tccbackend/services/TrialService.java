package com.eln23.tccbackend.services;

import com.eln23.tccbackend.dtos.filter.TrialFilterDto;
import com.eln23.tccbackend.dtos.request.TrialRequestDto;
import com.eln23.tccbackend.dtos.response.TrialResponseDto;
import com.eln23.tccbackend.entities.Trial;
import com.eln23.tccbackend.enums.TrialStatus;
import com.eln23.tccbackend.mappers.TrialMapper;
import com.eln23.tccbackend.repositories.TrialRepository;
import com.eln23.tccbackend.specs.TrialSpecs;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class TrialService {

    private final TrialRepository repository;
    private final TrialMapper mapper;
    private final MicroserviceClient microserviceClient;


    public TrialService(TrialRepository repository, TrialMapper mapper, MicroserviceClient microserviceClient) {
        this.repository = repository;
        this.mapper = mapper;
        this.microserviceClient = microserviceClient;
    }

    public Page<TrialResponseDto> readFiltered(TrialFilterDto filterDto, Pageable pageable) {
        Specification<Trial> spec = TrialSpecs.fromFilter(filterDto);
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    public Page<TrialResponseDto> readFilteredByInput(String input, Pageable pageable) {
        Specification<Trial> spec = TrialSpecs.fromInput(input);
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    public Optional<TrialResponseDto> readById(UUID id) {
        Optional<Trial> trial = repository.findById(id);
        return trial.map(mapper::toDto);
    }

    @Transactional
    public TrialResponseDto create(TrialRequestDto dto) {
        Trial entity = mapper.toEntity(dto);
        if (entity.getTimeStarted() == null) {
            entity.setTimeStarted(LocalDateTime.now());
        }
        entity = repository.save(entity);
        return mapper.toDto(entity);
    }

    @Transactional
    public TrialResponseDto start(TrialRequestDto dto) {
        UUID trialId = microserviceClient.startTrial(dto);
        return repository.findById(trialId)
                .map(mapper::toDto)
                .orElseThrow(() -> new IllegalStateException("Teste iniciado, mas nao encontrado no backend"));
    }

    @Transactional
    public Optional<TrialResponseDto> finish(UUID id) {
        return repository.findById(id).map(trial -> {
            trial.setEndTime(LocalDateTime.now());
            trial.setStatus(TrialStatus.IDLE);
            return mapper.toDto(repository.save(trial));
        });
    }

}
