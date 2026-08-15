package com.eln23.tccbackend.specs;

import com.eln23.tccbackend.dtos.filter.TrialFilterDto;
import com.eln23.tccbackend.entities.Trial;
import com.eln23.tccbackend.shared.utils.SpecificationUtils;
import org.springframework.data.jpa.domain.Specification;

public class TrialSpecs {

    private TrialSpecs() {}

    public static Specification<Trial> fromFilter(TrialFilterDto filterDto) {
        return Specification.allOf(
                SpecificationUtils.fromString(filterDto.mode() != null ? filterDto.mode().toString() : "", "mode"),
                SpecificationUtils.fromInteger(filterDto.numberCycles(), "numberCycles"),
                SpecificationUtils.fromLocalTime(filterDto.time(), "time"),
                SpecificationUtils.fromLocalDateTime(filterDto.timeStarted(), "timeStarted"),
                SpecificationUtils.fromLocalDateTime(filterDto.endTime(), "endTime")
        );
    }

    public static Specification<Trial> fromInput(String input) {
        input = input != null ? input.trim() : "";

        return Specification.anyOf(
                SpecificationUtils.fromString(input, "mode"),
                SpecificationUtils.fromIntegerAsString(input, "numberCycles"),
                SpecificationUtils.fromTimeAsString(input, "time"),
                SpecificationUtils.fromDateTimeAsString(input, "timeStarted"),
                SpecificationUtils.fromDateTimeAsString(input, "endTime")
        );
    }
}
