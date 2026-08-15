package com.eln23.tccbackend.controllers;

import com.eln23.tccbackend.dtos.filter.MeasurementFilterDto;
import com.eln23.tccbackend.dtos.response.MeasurementResponseDto;
import com.eln23.tccbackend.services.MeasurementService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/measurement")
public class MeasurementController {

    private final MeasurementService service;

    public MeasurementController(MeasurementService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<MeasurementResponseDto>> getMeasurementFiltered(@ParameterObject MeasurementFilterDto filterDto,
                                                                               @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.readFiltered(filterDto, pageable));
    }

    @GetMapping("/search/{input}")
    public ResponseEntity<Page<MeasurementResponseDto>> getMeasurementByInput(@PathVariable(required = false) String input,
                                                                              @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.readFilteredByInput(input, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeasurementResponseDto> getMeasurementById(@PathVariable String id) {
        return service.readById(UUID.fromString(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MeasurementResponseDto> postMeasurement(@RequestBody com.eln23.tccbackend.dtos.request.MeasurementRequestDto dto) {
        MeasurementResponseDto createdMeasurement = service.create(dto);
        return ResponseEntity.ok(createdMeasurement);
    }
}
