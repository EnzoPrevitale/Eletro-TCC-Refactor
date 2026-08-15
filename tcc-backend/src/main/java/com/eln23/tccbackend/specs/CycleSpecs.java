package com.eln23.tccbackend.specs;

import com.eln23.tccbackend.dtos.filter.CycleFilterDto;
import com.eln23.tccbackend.entities.Cycle;
import com.eln23.tccbackend.shared.utils.SpecificationUtils;
import org.springframework.data.jpa.domain.Specification;

public class CycleSpecs {

    private CycleSpecs() {}

    public static Specification<Cycle> fromFilter(CycleFilterDto filterDto) {
        return Specification.allOf(
                SpecificationUtils.fromInteger(filterDto.number(), "number"),
                SpecificationUtils.fromUUID(filterDto.trialId(), "trial", "id")
        );
    }

    public static Specification<Cycle> fromInput(String input) {
        input = input != null ? input.trim() : "";

        return Specification.anyOf(
                SpecificationUtils.fromIntegerAsString(input, "number")
        );
    }
}
