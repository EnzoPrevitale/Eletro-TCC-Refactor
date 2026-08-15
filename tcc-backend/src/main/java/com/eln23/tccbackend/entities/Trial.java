package com.eln23.tccbackend.entities;

import com.eln23.tccbackend.enums.TrialMode;
import com.eln23.tccbackend.enums.TrialStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Getter
@Setter
@Entity
@Table(name = "trial")
@SQLRestriction("active = true")
@SQLDelete(sql = "UPDATE trial SET active = false WHERE id = ?")
public class Trial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mode", nullable = false)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private TrialMode mode;

    @Column(name = "cycles")
    private Integer numberCycles;

    @Column(name = "time")
    private LocalTime time;

    @Column(name = "timeStarted", nullable = false)
    private LocalDateTime timeStarted;

    @Column(name = "endTime")
    private LocalDateTime endTime;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private TrialStatus status = TrialStatus.NEW_TEST;

}
