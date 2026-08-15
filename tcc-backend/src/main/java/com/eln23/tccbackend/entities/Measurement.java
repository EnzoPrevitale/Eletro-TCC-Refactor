package com.eln23.tccbackend.entities;

import com.eln23.tccbackend.enums.CycleStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Getter
@Setter
@Entity
@Table(name = "measurement")
@SQLRestriction("active = true")
@SQLDelete(sql = "UPDATE measurement SET active = false WHERE id = ?")
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JoinColumn(name = "cycle_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Cycle cycle;

    @Column(name = "cycle_status")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private CycleStatus cycleStatus;

    @Column(name = "time")
    private LocalTime time;

    @Column(name = "voltage")
    private Double voltage;

}
