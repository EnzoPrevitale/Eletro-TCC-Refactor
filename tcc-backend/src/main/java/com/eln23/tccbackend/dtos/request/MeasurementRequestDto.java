package com.eln23.tccbackend.dtos.request;

import com.eln23.tccbackend.enums.CycleStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;
import java.util.UUID;

public record MeasurementRequestDto(
        UUID cycleId,
        CycleStatus cycleStatus,
        @JsonFormat(pattern = "HH:mm:ss") LocalTime time,
        Double voltage
) {
}
