package com.eln23.tccbackend.mappers;

import com.eln23.tccbackend.dtos.request.CycleRequestDto;
import com.eln23.tccbackend.dtos.response.CycleResponseDto;
import com.eln23.tccbackend.entities.Cycle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CycleMapper {

    @Mapping(target = "trialId", source = "trial.id")
    CycleResponseDto toDto(Cycle cycle);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "trial", ignore = true)
    Cycle toEntity(CycleRequestDto dto);
}
