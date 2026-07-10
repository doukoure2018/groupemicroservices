import { IRole } from '@/interface/role';
import { UserAdminService } from '@/service/user-admin.service';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';

/**
 * Création d'un utilisateur backoffice par un admin : le compte est actif
 * immédiatement avec un mot de passe temporaire (pas d'email de vérification).
 * Les rôles assignables sont restreints côté serveur (whitelist backoffice).
 */
@Component({
    selector: 'app-create-user',
    standalone: true,
    imports: [FormsModule, ButtonModule, SelectModule, InputTextModule, MessageModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card max-w-2xl">
            <h2 class="mt-0 text-xl font-semibold">Créer un utilisateur backoffice</h2>
            <p class="text-surface-600 dark:text-surface-300 mt-1">
                Le compte est activé immédiatement. Communiquez le mot de passe temporaire à l'utilisateur ;
                il pourra le changer à la première connexion.
            </p>

            <form #form="ngForm" (ngSubmit)="submit(form)" class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label for="firstName" class="text-sm font-medium">Prénom *</label>
                    <input pInputText id="firstName" name="firstName" [(ngModel)]="model.firstName" required fluid />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="lastName" class="text-sm font-medium">Nom *</label>
                    <input pInputText id="lastName" name="lastName" [(ngModel)]="model.lastName" required fluid />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="email" class="text-sm font-medium">Email *</label>
                    <input pInputText id="email" name="email" type="email" [(ngModel)]="model.email" required email fluid />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="phone" class="text-sm font-medium">Téléphone</label>
                    <input pInputText id="phone" name="phone" [(ngModel)]="model.phone" placeholder="+224 6XX XX XX XX" fluid />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Rôle *</label>
                    <p-select name="roleName" [(ngModel)]="model.roleName" [options]="rolesAssignables()" optionLabel="label" optionValue="value" placeholder="Choisir un rôle" required fluid />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="password" class="text-sm font-medium">Mot de passe temporaire *</label>
                    <div class="flex gap-2">
                        <input pInputText id="password" name="password" [(ngModel)]="model.password" required minlength="6" fluid />
                        <button pButton type="button" icon="pi pi-refresh" [outlined]="true" (click)="genererMotDePasse()" pTooltip="Générer"></button>
                    </div>
                </div>

                @if (erreur()) {
                    <div class="md:col-span-2"><p-message severity="error" styleClass="w-full">{{ erreur() }}</p-message></div>
                }

                <div class="md:col-span-2 flex gap-3 mt-2">
                    <button pButton type="submit" label="Créer le compte" icon="pi pi-user-plus" [disabled]="form.invalid || saving()" [loading]="saving()"></button>
                    <button pButton type="button" label="Annuler" severity="secondary" [text]="true" (click)="retour()"></button>
                </div>
            </form>
        </div>
    `
})
export class CreateUserComponent implements OnInit {
    private userAdminService = inject(UserAdminService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    saving = signal(false);
    erreur = signal<string | undefined>(undefined);
    rolesAssignables = signal<{ label: string; value: string }[]>([]);

    // Whitelist alignée sur le backend (createBackofficeUser).
    private readonly whitelist = ['ADMIN_CONFORMITE', 'ADMIN_BACKOFFICE', 'CONTROLEUR', 'MANAGER', 'ADMIN'];
    private readonly libelles: Record<string, string> = {
        ADMIN_CONFORMITE: 'Conformité (validation agences)',
        ADMIN_BACKOFFICE: 'Back-office (leads immo)',
        CONTROLEUR: 'Contrôleur (validation billets)',
        MANAGER: 'Manager',
        ADMIN: 'Administrateur'
    };

    model = { firstName: '', lastName: '', email: '', phone: '', password: '', roleName: '' };

    ngOnInit(): void {
        // Récupère les rôles du serveur et n'expose que ceux de la whitelist.
        this.userAdminService.getRoles$().subscribe({
            next: (response) => {
                const roles: IRole[] = response.data?.['roles'] ?? [];
                const dispo = roles
                    .map((r) => r.name!)
                    .filter((name) => this.whitelist.includes(name))
                    .map((name) => ({ label: this.libelles[name] ?? name, value: name }));
                // Fallback : si /roles ne renvoie rien, utiliser la whitelist statique.
                this.rolesAssignables.set(dispo.length ? dispo : this.whitelist.map((n) => ({ label: this.libelles[n], value: n })));
            },
            error: () => this.rolesAssignables.set(this.whitelist.map((n) => ({ label: this.libelles[n], value: n })))
        });
    }

    genererMotDePasse(): void {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let pwd = '';
        for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
        this.model.password = pwd + '#1';
    }

    submit(form: NgForm): void {
        if (form.invalid) return;
        this.saving.set(true);
        this.erreur.set(undefined);
        this.userAdminService.createBackofficeUser$(this.model).subscribe({
            next: (response) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'success', summary: 'Compte créé', detail: response.message });
                setTimeout(() => this.router.navigate(['/dashboards/admin/utilisateurs']), 1200);
            },
            error: (error) => {
                this.saving.set(false);
                this.erreur.set(String(error));
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: String(error) });
            }
        });
    }

    retour(): void {
        this.router.navigate(['/dashboards/admin/utilisateurs']);
    }
}
