import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserAdminService } from '@/service/user-admin.service';
import { IUser } from '@/interface/user';
import { IRole } from '@/interface/role';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface UserAdminState {
    loading: boolean;
    users: IUser[];
    roles: IRole[];
    selectedUser: IUser | null;
    isRoleDialogOpen: boolean;
}

@Component({
    selector: 'app-utilisateurs',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ConfirmDialogModule, TagModule, TooltipModule, CardModule, ProgressSpinnerModule, SelectModule, IconFieldModule, InputIconModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './utilisateurs.component.html',
    styleUrl: './utilisateurs.component.scss'
})
export class UtilisateursComponent implements OnInit {
    private userAdminService = inject(UserAdminService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    state = signal<UserAdminState>({
        loading: false,
        users: [],
        roles: [],
        selectedUser: null,
        isRoleDialogOpen: false
    });

    // Propriété simple pour le p-select (PrimeNG ne fonctionne pas avec les signals)
    newRole: string | null = null;
    roleDialogVisible = false;

    // Computed signals
    users = computed(() => this.state().users);
    roles = computed(() => this.state().roles);
    loading = computed(() => this.state().loading);
    selectedUser = computed(() => this.state().selectedUser);

    // Stats
    totalUsers = computed(() => this.state().users.length);
    activeUsers = computed(() => this.state().users.filter((u) => u.enabled).length);
    controleurs = computed(() => this.state().users.filter((u) => u.role === 'CONTROLEUR').length);
    admins = computed(() => this.state().users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length);

    // Search
    searchTerm = signal<string>('');

    filteredUsers = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.users();
        return this.users().filter(
            (user) => user.firstName?.toLowerCase().includes(term) || user.lastName?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term) || user.username?.toLowerCase().includes(term) || user.role?.toLowerCase().includes(term)
        );
    });

    ngOnInit(): void {
        this.loadUsers();
        this.loadRoles();
    }

    loadUsers(): void {
        this.updateState({ loading: true });
        this.userAdminService.getAllUsers$().subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    users: response.data.users || []
                });
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    loadRoles(): void {
        this.userAdminService.getRoles$().subscribe({
            next: (response) => {
                this.updateState({
                    roles: response.data.roles || []
                });
            },
            error: (error) => {
                this.showError('Erreur lors du chargement des rôles: ' + error);
            }
        });
    }

    openRoleDialog(user: IUser): void {
        this.newRole = user.role;
        this.roleDialogVisible = true;
        this.updateState({
            selectedUser: user
        });
    }

    closeRoleDialog(): void {
        this.roleDialogVisible = false;
        this.newRole = null;
        this.updateState({
            selectedUser: null
        });
    }

    confirmUpdateRole(): void {
        const user = this.selectedUser();
        if (!user || !this.newRole) return;

        if (this.newRole === user.role) {
            this.closeRoleDialog();
            return;
        }

        const role = this.newRole;
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir changer le rôle de "${user.firstName} ${user.lastName}" de ${user.role} à ${role} ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, modifier',
            rejectLabel: 'Non',
            accept: () => {
                this.updateRole(user.userUuid, role);
            }
        });
    }

    private updateRole(userUuid: string, role: string): void {
        this.updateState({ loading: true });

        this.userAdminService.updateUserRole$(userUuid, role).subscribe({
            next: (response) => {
                const updatedUser = response.data.user;
                if (updatedUser) {
                    const updatedUsers = this.users().map((u) => (u.userUuid === userUuid ? updatedUser : u));
                    this.updateState({
                        loading: false,
                        users: updatedUsers,
                        selectedUser: null
                    });
                }
                this.closeRoleDialog();
                this.showSuccess(response.message || 'Rôle mis à jour avec succès');
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    private updateState(partialState: Partial<UserAdminState>): void {
        this.state.update((current) => ({
            ...current,
            ...partialState
        }));
    }

    private showSuccess(message: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: message,
            life: 3000
        });
    }

    private showError(error: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error,
            life: 5000
        });
    }

    getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'danger';
            case 'ADMIN':
                return 'warn';
            case 'MANAGER':
                return 'info';
            case 'CONTROLEUR':
                return 'contrast';
            case 'TECH_SUPPORT':
                return 'secondary';
            default:
                return 'success';
        }
    }

    getStatusSeverity(enabled: boolean): 'success' | 'danger' {
        return enabled ? 'success' : 'danger';
    }
}
