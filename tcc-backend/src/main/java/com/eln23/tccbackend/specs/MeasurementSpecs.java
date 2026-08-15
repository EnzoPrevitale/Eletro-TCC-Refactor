package com.eln23.tccbackend.specs;

import com.eln23.tccbackend.dtos.filter.MeasurementFilterDto;
import com.eln23.tccbackend.entities.Measurement;
import com.eln23.tccbackend.shared.utils.SpecificationUtils;
import org.springframework.data.jpa.domain.Specification;

public class MeasurementSpecs {

    private MeasurementSpecs() {}

    public static Specification<Measurement> fromFilter(MeasurementFilterDto filterDto) {
        return Specification.allOf(
                SpecificationUtils.fromUUID(filterDto.cycleId(), "cycle", "id"),
                SpecificationUtils.fromEnum(filterDto.cycleStatus(), "cycleStatus"),
                SpecificationUtils.fromLocalTime(filterDto.time(), "time"),
                SpecificationUtils.fromDouble(filterDto.voltage(), "voltage")
        );
    }

    public static Specification<Measurement> fromInput(String input) {
        input = input != null ? input.trim() : "";

        return Specification.anyOf(
                SpecificationUtils.fromTimeAsString(input, "time"),
                SpecificationUtils.fromDoubleAsString(input, "voltage")
        );
    }
}
