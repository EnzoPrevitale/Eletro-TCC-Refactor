package com.eln23.tccbackend.mappers;

import com.eln23.tccbackend.dtos.request.TrialRequestDto;
import com.eln23.tccbackend.dtos.response.TrialResponseDto;
import com.eln23.tccbackend.entities.Trial;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TrialMapper {

    TrialResponseDto toDto(Trial trial);

    @Mapping(target = "status", ignore = true)
    Trial toEntity(TrialRequestDto dto);

}
