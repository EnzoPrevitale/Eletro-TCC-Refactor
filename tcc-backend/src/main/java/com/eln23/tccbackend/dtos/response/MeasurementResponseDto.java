package com.eln23.tccbackend.dtos.response;

import com.eln23.tccbackend.enums.CycleStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;
import java.util.UUID;

public record MeasurementResponseDto(
        UUID id,
        UUID cycleId,
        CycleStatus cycleStatus,
        @JsonFormat(pattern = "HH:mm:ss") LocalTime time,
        Double voltage
) {
}
