import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { VilleService } from '@/service/ville.service';
import { IVille } from '@/interface/ville';

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
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ICommune } from '@/interface/commune';
import { CommuneService } from '@/service/commune.service';

interface CommuneState {
    loading: boolean;
    communes: ICommune[];
    villes: IVille[];
    selectedCommune: ICommune | null;
    selectedVilleFilter: IVille | null;
    isModalOpen: boolean;
    isEditMode: boolean;
}

@Component({
    selector: 'app-communes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        CardModule,
        ProgressSpinnerModule,
        InputGroupModule,
        InputGroupAddonModule,
        MessageModule,
        RippleModule,
        DropdownModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './communes.component.html',
    styleUrl: './communes.component.scss'
})
export class CommunesComponent implements OnInit {
    private communeService = inject(CommuneService);
    private villeService = inject(VilleService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    // Signal pour l'état global
    state = signal<CommuneState>({
        loading: false,
        communes: [],
        villes: [],
        selectedCommune: null,
        selectedVilleFilter: null,
        isModalOpen: false,
        isEditMode: false
    });

    // Signaux calculés
    communes = computed(() => this.state().communes);
    villes = computed(() => this.state().villes);
    loading = computed(() => this.state().loading);
    isModalOpen = computed(() => this.state().isModalOpen);
    isEditMode = computed(() => this.state().isEditMode);
    selectedCommune = computed(() => this.state().selectedCommune);
    selectedVilleFilter = computed(() => this.state().selectedVilleFilter);

    // Statistiques calculées
    totalCommunes = computed(() => this.state().communes.length);
    activeCommunes = computed(() => this.state().communes.filter((c) => c.actif).length);
    inactiveCommunes = computed(() => this.state().communes.filter((c) => !c.actif).length);

    // Villes actives pour le dropdown
    activeVilles = computed(() => this.state().villes.filter((v) => v.actif));

    // Formulaire
    communeForm!: FormGroup;

    // Signal pour la recherche
    searchTerm = signal<string>('');

    // Communes filtrées
    filteredCommunes = computed(() => {
        let result = this.communes();

        // Filtre par ville
        const villeFilter = this.selectedVilleFilter();
        if (villeFilter) {
            result = result.filter((c) => c.villeUuid === villeFilter.villeUuid);
        }

        // Filtre par recherche
        const term = this.searchTerm().toLowerCase();
        if (term) {
            result = result.filter((commune) => commune.libelle.toLowerCase().includes(term) || commune.villeLibelle?.toLowerCase().includes(term) || commune.regionLibelle?.toLowerCase().includes(term));
        }

        return result;
    });

    ngOnInit(): void {
        this.initForm();
        this.loadVilles();
        this.loadCommunes();
    }

    private initForm(): void {
        this.communeForm = this.fb.group({
            villeUuid: ['', [Validators.required]],
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
        });
    }

    /**
     * Charge toutes les villes
     */
    loadVilles(): void {
        this.villeService.getAllVilles$().subscribe({
            next: (response) => {
                this.updateState({
                    villes: response.data.villes || []
                });
            },
            error: (error) => {
                this.showError('Erreur lors du chargement des villes: ' + error);
            }
        });
    }

    /**
     * Charge toutes les communes
     */
    loadCommunes(): void {
        this.updateState({ loading: true });

        this.communeService.getAllCommunes$().subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    communes: response.data.communes || []
                });
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Filtre par ville
     */
    onVilleFilterChange(ville: IVille | null): void {
        this.updateState({ selectedVilleFilter: ville });
    }

    /**
     * Efface le filtre ville
     */
    clearVilleFilter(): void {
        this.updateState({ selectedVilleFilter: null });
    }

    /**
     * Ouvre le modal pour créer une commune
     */
    openCreateModal(): void {
        this.communeForm.reset();
        this.updateState({
            isModalOpen: true,
            isEditMode: false,
            selectedCommune: null
        });
    }

    /**
     * Ouvre le modal pour éditer une commune
     */
    openEditModal(commune: ICommune): void {
        this.communeForm.patchValue({
            villeUuid: commune.villeUuid,
            libelle: commune.libelle
        });
        this.updateState({
            isModalOpen: true,
            isEditMode: true,
            selectedCommune: commune
        });
    }

    /**
     * Ferme le modal
     */
    closeModal(): void {
        this.updateState({
            isModalOpen: false,
            isEditMode: false,
            selectedCommune: null
        });
        this.communeForm.reset();
    }

    /**
     * Soumet le formulaire
     */
    onSubmit(): void {
        if (this.communeForm.invalid) {
            this.communeForm.markAllAsTouched();
            return;
        }

        const formData = this.communeForm.value;

        if (this.isEditMode() && this.selectedCommune()) {
            this.updateCommune(this.selectedCommune()!.communeUuid, formData);
        } else {
            this.createCommune(formData);
        }
    }

    /**
     * Crée une nouvelle commune
     */
    private createCommune(data: { villeUuid: string; libelle: string }): void {
        this.updateState({ loading: true });

        this.communeService.createCommune$(data).subscribe({
            next: (response) => {
                const newCommune = response.data.commune;
                if (newCommune) {
                    this.updateState({
                        loading: false,
                        communes: [...this.communes(), newCommune],
                        isModalOpen: false
                    });
                }
                this.communeForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Met à jour une commune
     */
    private updateCommune(communeUuid: string, data: { villeUuid: string; libelle: string }): void {
        this.updateState({ loading: true });

        this.communeService.updateCommune$(communeUuid, data).subscribe({
            next: (response) => {
                const updatedCommune = response.data.commune;
                if (updatedCommune) {
                    const updatedCommunes = this.communes().map((c) => (c.communeUuid === communeUuid ? updatedCommune : c));
                    this.updateState({
                        loading: false,
                        communes: updatedCommunes,
                        isModalOpen: false,
                        selectedCommune: null
                    });
                }
                this.communeForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Confirme le changement de statut
     */
    confirmToggleStatus(commune: ICommune): void {
        const action = commune.actif ? 'désactiver' : 'activer';
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} la commune "${commune.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.toggleCommuneStatus(commune);
            }
        });
    }

    /**
     * Active ou désactive une commune
     */
    private toggleCommuneStatus(commune: ICommune): void {
        const newStatus = !commune.actif;

        this.communeService.updateCommuneStatus$(commune.communeUuid, newStatus).subscribe({
            next: (response) => {
                const updatedCommune = response.data.commune;
                if (updatedCommune) {
                    const updatedCommunes = this.communes().map((c) => (c.communeUuid === commune.communeUuid ? updatedCommune : c));
                    this.updateState({ communes: updatedCommunes });
                }
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.showError(error);
            }
        });
    }

    /**
     * Met à jour le terme de recherche
     */
    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    /**
     * Met à jour l'état
     */
    private updateState(partialState: Partial<CommuneState>): void {
        this.state.update((current) => ({
            ...current,
            ...partialState
        }));
    }

    /**
     * Affiche un message de succès
     */
    private showSuccess(message: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: message,
            life: 3000
        });
    }

    /**
     * Affiche un message d'erreur
     */
    private showError(error: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: error,
            life: 5000
        });
    }

    /**
     * Retourne la sévérité du tag
     */
    getStatusSeverity(actif: boolean): 'success' | 'danger' {
        return actif ? 'success' : 'danger';
    }

    /**
     * Vérifie si un champ est invalide
     */
    isFieldInvalid(fieldName: string): boolean {
        const field = this.communeForm.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    /**
     * Récupère le message d'erreur
     */
    getFieldError(fieldName: string): string {
        const field = this.communeForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Ce champ est obligatoire';
            if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
            if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
        }
        return '';
    }

    /**
     * Titre du modal
     */
    get modalTitle(): string {
        return this.isEditMode() ? 'Modifier la commune' : 'Nouvelle commune';
    }
}
