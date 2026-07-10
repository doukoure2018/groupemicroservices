package io.multi.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Création d'un utilisateur backoffice par un admin (rôle whitelisté côté serveur). */
@Getter
@Setter
public class AdminCreateUserRequest {
    @NotEmpty(message = "Le prénom est requis")
    private String firstName;
    @NotEmpty(message = "Le nom est requis")
    private String lastName;
    @NotEmpty(message = "L'email est requis")
    @Email(message = "Email invalide")
    private String email;
    private String phone;
    @NotEmpty(message = "Le mot de passe temporaire est requis")
    @Size(min = 6, message = "Mot de passe trop court (min. 6 caractères)")
    private String password;
    @NotEmpty(message = "Le rôle est requis")
    private String roleName;
}
