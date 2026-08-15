package com.eln23.tccbackend.repositories;

import com.eln23.tccbackend.entities.Measurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface MeasurementRepository extends JpaRepository<Measurement, UUID>, JpaSpecificationExecutor<Measurement> {
}
