package com.eln23.tccbackend.repositories;

import com.eln23.tccbackend.entities.Trial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface TrialRepository extends JpaRepository<Trial, UUID>, JpaSpecificationExecutor<Trial> {
}
