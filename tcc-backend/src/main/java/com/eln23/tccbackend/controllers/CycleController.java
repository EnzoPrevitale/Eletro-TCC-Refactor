package com.eln23.tccbackend.controllers;

import com.eln23.tccbackend.dtos.filter.CycleFilterDto;
import com.eln23.tccbackend.dtos.response.CycleResponseDto;
import com.eln23.tccbackend.services.CycleService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/cycle")
public class CycleController {

    private final CycleService service;

    public CycleController(CycleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<CycleResponseDto>> getCycleFiltered(@ParameterObject CycleFilterDto filterDto,
                                                                   @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.readFiltered(filterDto, pageable));
    }

    @GetMapping("/search/{input}")
    public ResponseEntity<Page<CycleResponseDto>> getCycleByInput(@PathVariable(required = false) String input,
                                                                  @ParameterObject Pageable pageable) {
        return ResponseEntity.ok(service.readFilteredByInput(input, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CycleResponseDto> getCycleById(@PathVariable String id) {
        return service.readById(UUID.fromString(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CycleResponseDto> postCycle(@RequestBody com.eln23.tccbackend.dtos.request.CycleRequestDto dto) {
        CycleResponseDto createdCycle = service.create(dto);
        return ResponseEntity.ok(createdCycle);
    }
}
