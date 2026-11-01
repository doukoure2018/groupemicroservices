package io.multi.billetterieservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandeRequest {

    @NotBlank(message = "L'offre est obligatoire")
    private String offreUuid;

    @NotEmpty(message = "Au moins un passager est requis")
    @Valid
    private List<PassagerDto> passagers;

    @NotBlank(message = "Le mode de règlement est obligatoire")
    private String modeReglementCode;

    /**
     * Le total à payer tel que le client l'a vu sur le devis. Le serveur
     * recalcule et refuse la commande si les deux diffèrent : personne ne
     * doit payer un montant qui ne lui a pas été montré.
     */
    @NotNull(message = "Le montant total est obligatoire")
    private BigDecimal montantTotal;

    /** Bagages supplémentaires, au-delà de la franchise de chaque passager. */
    @Min(value = 0, message = "Le nombre de bagages ne peut pas être négatif")
    @Max(value = 10, message = "Dix bagages supplémentaires au plus")
    private Integer nombreBagages;

    /** Où prévenir le voyageur ; à défaut, l'email du compte et le téléphone du premier adulte. */
    @Email(message = "L'email de contact est invalide")
    private String contactEmail;

    private String contactTelephone;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassagerDto {
        @NotBlank(message = "Le nom du passager est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom du passager est obligatoire")
        private String prenom;

        /** Facultatif pour un enfant ; le contact de la commande reste obligatoire. */
        private String telephone;

        private String pieceIdentite;

        /** ADULTE (défaut) ou ENFANT. */
        private String typePassager;

        /** Exigée pour un enfant : c'est elle qui justifie le tarif. */
        private LocalDate dateNaissance;
    }
}
