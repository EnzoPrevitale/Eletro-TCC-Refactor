package com.eln23.tccbackend.mappers;

import com.eln23.tccbackend.dtos.request.MeasurementRequestDto;
import com.eln23.tccbackend.dtos.response.MeasurementResponseDto;
import com.eln23.tccbackend.entities.Measurement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MeasurementMapper {

    @Mapping(target = "cycleId", source = "cycle.id")
    MeasurementResponseDto toDto(Measurement measurement);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cycle", ignore = true)
    Measurement toEntity(MeasurementRequestDto dto);
}
