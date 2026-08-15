package com.eln23.tccbackend.controllers;

import com.eln23.tccbackend.dtos.filter.TrialFilterDto;
import com.eln23.tccbackend.dtos.response.TrialResponseDto;
import com.eln23.tccbackend.services.MicroserviceClient;
import com.eln23.tccbackend.services.TrialService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.UUID;

@RestController
@RequestMapping("/trial")
public class TrialController {

    private final TrialService service;

    public TrialController(TrialService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<TrialResponseDto>> getTrialFiltered(@ParameterObject TrialFilterDto filterDto,
                                                                   @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.readFiltered(filterDto, pageable));
    }

    @GetMapping("/search/{input}")
    public ResponseEntity<Page<TrialResponseDto>> getTrialByInput(@PathVariable(required = false) String input,
                                                                  @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.readFilteredByInput(input, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrialResponseDto> getTrialById(@RequestParam String id) {
        return service.readById(java.util.UUID.fromString(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TrialResponseDto> postTrial(@RequestBody com.eln23.tccbackend.dtos.request.TrialRequestDto dto) {
        TrialResponseDto createdTrial = service.create(dto);
        return ResponseEntity.ok(createdTrial);
    }

    @PostMapping("/start")
    public ResponseEntity<TrialResponseDto> startTrial(@RequestBody com.eln23.tccbackend.dtos.request.TrialRequestDto dto) {
        return ResponseEntity.ok(service.start(dto));
    }

    @ExceptionHandler(MicroserviceClient.MicroserviceException.class)
    public ResponseEntity<Map<String, String>> microserviceError(MicroserviceClient.MicroserviceException exception) {
        return ResponseEntity.status(503).body(Map.of("error", exception.getMessage()));
    }

    @PatchMapping("/{id}/finish")
    public ResponseEntity<TrialResponseDto> finishTrial(@PathVariable UUID id) {
        return service.finish(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
