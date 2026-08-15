package com.eln23.tccbackend.dtos.filter;

import com.eln23.tccbackend.enums.CycleStatus;

import java.time.LocalTime;
import java.util.UUID;

public record MeasurementFilterDto(
        UUID cycleId,
        CycleStatus cycleStatus,
        LocalTime time,
        Double voltage
) {
}
