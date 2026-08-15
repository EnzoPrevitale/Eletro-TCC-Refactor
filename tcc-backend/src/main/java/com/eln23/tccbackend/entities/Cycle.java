package com.eln23.tccbackend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Data
@Getter
@Setter
@Entity
@Table(name = "cycle")
@SQLRestriction("active = true")
@SQLDelete(sql = "UPDATE cycle SET active = false WHERE id = ?")
public class Cycle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "number")
    private Integer number;

    @JoinColumn(name = "trial_id", referencedColumnName = "id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Trial trial;

}
