package com.eln23.tccbackend.dtos.request;

import java.util.UUID;

public record CycleRequestDto(
        Integer number,
        UUID trialId
) {
}
