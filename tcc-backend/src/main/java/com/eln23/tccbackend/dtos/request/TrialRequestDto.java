package com.eln23.tccbackend.dtos.request;

import com.eln23.tccbackend.enums.TrialMode;
import com.eln23.tccbackend.enums.TrialStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record TrialRequestDto(
        TrialMode mode,
        Integer numberCycles,
        @JsonFormat(pattern = "HH:mm:ss") LocalTime time,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime timeStarted,
        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss") LocalDateTime endTime,
        TrialStatus status
) {
}
