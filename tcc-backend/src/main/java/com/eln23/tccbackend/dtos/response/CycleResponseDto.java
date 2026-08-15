package com.eln23.tccbackend.dtos.response;

import java.util.UUID;

public record CycleResponseDto(
        UUID id,
        Integer number,
        UUID trialId
) {
}
