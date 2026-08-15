package com.eln23.tccbackend.dtos.filter;

import com.eln23.tccbackend.enums.TrialMode;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record TrialFilterDto(
        TrialMode mode,
        Integer numberCycles,
        LocalTime time,
        LocalDateTime timeStarted,
        LocalDateTime endTime
) {
}
