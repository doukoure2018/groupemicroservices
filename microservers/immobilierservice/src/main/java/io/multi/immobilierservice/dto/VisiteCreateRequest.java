package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class VisiteCreateRequest {

    @NotNull
    @FutureOrPresent(message = "La date de visite doit être aujourd'hui ou plus tard")
    private LocalDate dateVisite;

    private LocalTime heureVisite;

    @Size(max = 1000)
    private String notesVisiteur;
}
