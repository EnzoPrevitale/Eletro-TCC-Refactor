package com.eln23.tccbackend.repositories;

import com.eln23.tccbackend.entities.Cycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface CycleRepository extends JpaRepository<Cycle, UUID>, JpaSpecificationExecutor<Cycle> {
}
