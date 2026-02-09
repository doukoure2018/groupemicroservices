import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegionService } from '@/service/region.service';
import { IRegion } from '@/interface/region';

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
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface RegionState {
    loading: boolean;
    regions: IRegion[];
    selectedRegion: IRegion | null;
    isModalOpen: boolean;
    isEditMode: boolean;
}

@Component({
    selector: 'app-regions',
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
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './regions.component.html',
    styleUrl: './regions.component.scss'
})
export class RegionsComponent implements OnInit {
    private regionService = inject(RegionService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    // Signal pour l'état global
    state = signal<RegionState>({
        loading: false,
        regions: [],
        selectedRegion: null,
        isModalOpen: false,
        isEditMode: false
    });

    // Signaux calculés
    regions = computed(() => this.state().regions);
    loading = computed(() => this.state().loading);
    isModalOpen = computed(() => this.state().isModalOpen);
    isEditMode = computed(() => this.state().isEditMode);
    selectedRegion = computed(() => this.state().selectedRegion);

    // Statistiques calculées
    totalRegions = computed(() => this.state().regions.length);
    activeRegions = computed(() => this.state().regions.filter((r) => r.actif).length);
    inactiveRegions = computed(() => this.state().regions.filter((r) => !r.actif).length);

    // Formulaire
    regionForm!: FormGroup;

    // Signal pour la recherche
    searchTerm = signal<string>('');

    // Régions filtrées
    filteredRegions = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.regions();
        return this.regions().filter((region) => region.libelle.toLowerCase().includes(term) || region.code?.toLowerCase().includes(term));
    });

    ngOnInit(): void {
        this.initForm();
        this.loadRegions();
    }

    private initForm(): void {
        this.regionForm = this.fb.group({
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            code: ['', [Validators.maxLength(10)]]
        });
    }

    /**
     * Charge toutes les régions
     */
    loadRegions(): void {
        this.updateState({ loading: true });

        this.regionService.getAllRegions$().subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    regions: response.data.regions || []
                });
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Ouvre le modal pour créer une région
     */
    openCreateModal(): void {
        this.regionForm.reset();
        this.updateState({
            isModalOpen: true,
            isEditMode: false,
            selectedRegion: null
        });
    }

    /**
     * Ouvre le modal pour éditer une région
     */
    openEditModal(region: IRegion): void {
        this.regionForm.patchValue({
            libelle: region.libelle,
            code: region.code
        });
        this.updateState({
            isModalOpen: true,
            isEditMode: true,
            selectedRegion: region
        });
    }

    /**
     * Ferme le modal
     */
    closeModal(): void {
        this.updateState({
            isModalOpen: false,
            isEditMode: false,
            selectedRegion: null
        });
        this.regionForm.reset();
    }

    /**
     * Soumet le formulaire (création ou mise à jour)
     */
    onSubmit(): void {
        if (this.regionForm.invalid) {
            this.regionForm.markAllAsTouched();
            return;
        }

        const formData = this.regionForm.value;

        if (this.isEditMode() && this.selectedRegion()) {
            this.updateRegion(this.selectedRegion()!.regionUuid, formData);
        } else {
            this.createRegion(formData);
        }
    }

    /**
     * Crée une nouvelle région
     */
    private createRegion(data: { libelle: string; code?: string }): void {
        this.updateState({ loading: true });

        this.regionService.createRegion$(data).subscribe({
            next: (response) => {
                const newRegion = response.data.region;
                if (newRegion) {
                    this.updateState({
                        loading: false,
                        regions: [...this.regions(), newRegion],
                        isModalOpen: false
                    });
                }
                this.regionForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Met à jour une région
     */
    private updateRegion(regionUuid: string, data: { libelle: string; code?: string }): void {
        this.updateState({ loading: true });

        this.regionService.updateRegion$(regionUuid, data).subscribe({
            next: (response) => {
                const updatedRegion = response.data.region;
                if (updatedRegion) {
                    const updatedRegions = this.regions().map((r) => (r.regionUuid === regionUuid ? updatedRegion : r));
                    this.updateState({
                        loading: false,
                        regions: updatedRegions,
                        isModalOpen: false,
                        selectedRegion: null
                    });
                }
                this.regionForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Confirme le changement de statut d'une région
     */
    confirmToggleStatus(region: IRegion): void {
        const action = region.actif ? 'désactiver' : 'activer';
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} la région "${region.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.toggleRegionStatus(region);
            }
        });
    }

    /**
     * Active ou désactive une région
     */
    private toggleRegionStatus(region: IRegion): void {
        const newStatus = !region.actif;

        this.regionService.updateRegionStatus$(region.regionUuid, { actif: newStatus }).subscribe({
            next: (response) => {
                const updatedRegion = response.data.region;
                if (updatedRegion) {
                    const updatedRegions = this.regions().map((r) => (r.regionUuid === region.regionUuid ? updatedRegion : r));
                    this.updateState({ regions: updatedRegions });
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
    private updateState(partialState: Partial<RegionState>): void {
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
     * Retourne la sévérité du tag selon le statut
     */
    getStatusSeverity(actif: boolean): 'success' | 'danger' {
        return actif ? 'success' : 'danger';
    }

    /**
     * Vérifie si un champ du formulaire est invalide
     */
    isFieldInvalid(fieldName: string): boolean {
        const field = this.regionForm.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    /**
     * Récupère le message d'erreur d'un champ
     */
    getFieldError(fieldName: string): string {
        const field = this.regionForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Ce champ est obligatoire';
            if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
            if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
        }
        return '';
    }

    /**
     * Retourne le titre du modal
     */
    get modalTitle(): string {
        return this.isEditMode() ? 'Modifier la région' : 'Nouvelle région';
    }
}
