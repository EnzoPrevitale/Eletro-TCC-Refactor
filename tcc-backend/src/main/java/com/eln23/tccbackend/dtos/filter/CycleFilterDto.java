package com.eln23.tccbackend.dtos.filter;

import java.util.UUID;

public record CycleFilterDto(
        Integer number,
        UUID trialId
) {
}
