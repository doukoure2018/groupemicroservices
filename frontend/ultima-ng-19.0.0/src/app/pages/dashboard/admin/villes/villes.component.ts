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
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { IVille } from '@/interface/ville';
import { VilleService } from '@/service/ville.service';

interface VilleState {
    loading: boolean;
    villes: IVille[];
    regions: IRegion[];
    selectedVille: IVille | null;
    selectedRegionFilter: IRegion | null;
    isModalOpen: boolean;
    isEditMode: boolean;
}

@Component({
    selector: 'app-villes',
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
    templateUrl: './villes.component.html',
    styleUrl: './villes.component.scss'
})
export class VillesComponent implements OnInit {
    private villeService = inject(VilleService);
    private regionService = inject(RegionService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    // Signal pour l'état global
    state = signal<VilleState>({
        loading: false,
        villes: [],
        regions: [],
        selectedVille: null,
        selectedRegionFilter: null,
        isModalOpen: false,
        isEditMode: false
    });

    // Signaux calculés
    villes = computed(() => this.state().villes);
    regions = computed(() => this.state().regions);
    loading = computed(() => this.state().loading);
    isModalOpen = computed(() => this.state().isModalOpen);
    isEditMode = computed(() => this.state().isEditMode);
    selectedVille = computed(() => this.state().selectedVille);
    selectedRegionFilter = computed(() => this.state().selectedRegionFilter);

    // Statistiques calculées
    totalVilles = computed(() => this.state().villes.length);
    activeVilles = computed(() => this.state().villes.filter((v) => v.actif).length);
    inactiveVilles = computed(() => this.state().villes.filter((v) => !v.actif).length);

    // Régions actives pour le dropdown
    activeRegions = computed(() => this.state().regions.filter((r) => r.actif));

    // Formulaire
    villeForm!: FormGroup;

    // Signal pour la recherche
    searchTerm = signal<string>('');

    // Villes filtrées
    filteredVilles = computed(() => {
        let result = this.villes();

        // Filtre par région
        const regionFilter = this.selectedRegionFilter();
        if (regionFilter) {
            result = result.filter((v) => v.regionUuid === regionFilter.regionUuid);
        }

        // Filtre par recherche
        const term = this.searchTerm().toLowerCase();
        if (term) {
            result = result.filter((ville) => ville.libelle.toLowerCase().includes(term) || ville.codePostal?.toLowerCase().includes(term) || ville.regionLibelle?.toLowerCase().includes(term));
        }

        return result;
    });

    ngOnInit(): void {
        this.initForm();
        this.loadRegions();
        this.loadVilles();
    }

    private initForm(): void {
        this.villeForm = this.fb.group({
            regionUuid: ['', [Validators.required]],
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            codePostal: ['', [Validators.maxLength(10)]]
        });
    }

    /**
     * Charge toutes les régions
     */
    loadRegions(): void {
        this.regionService.getAllRegions$().subscribe({
            next: (response) => {
                this.updateState({
                    regions: response.data.regions || []
                });
            },
            error: (error) => {
                this.showError('Erreur lors du chargement des régions: ' + error);
            }
        });
    }

    /**
     * Charge toutes les villes
     */
    loadVilles(): void {
        this.updateState({ loading: true });

        this.villeService.getAllVilles$().subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    villes: response.data.villes || []
                });
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Filtre par région
     */
    onRegionFilterChange(region: IRegion | null): void {
        this.updateState({ selectedRegionFilter: region });
    }

    /**
     * Efface le filtre région
     */
    clearRegionFilter(): void {
        this.updateState({ selectedRegionFilter: null });
    }

    /**
     * Ouvre le modal pour créer une ville
     */
    openCreateModal(): void {
        this.villeForm.reset();
        this.updateState({
            isModalOpen: true,
            isEditMode: false,
            selectedVille: null
        });
    }

    /**
     * Ouvre le modal pour éditer une ville
     */
    openEditModal(ville: IVille): void {
        this.villeForm.patchValue({
            regionUuid: ville.regionUuid,
            libelle: ville.libelle,
            codePostal: ville.codePostal
        });
        this.updateState({
            isModalOpen: true,
            isEditMode: true,
            selectedVille: ville
        });
    }

    /**
     * Ferme le modal
     */
    closeModal(): void {
        this.updateState({
            isModalOpen: false,
            isEditMode: false,
            selectedVille: null
        });
        this.villeForm.reset();
    }

    /**
     * Soumet le formulaire (création ou mise à jour)
     */
    onSubmit(): void {
        if (this.villeForm.invalid) {
            this.villeForm.markAllAsTouched();
            return;
        }

        const formData = this.villeForm.value;

        if (this.isEditMode() && this.selectedVille()) {
            this.updateVille(this.selectedVille()!.villeUuid, formData);
        } else {
            this.createVille(formData);
        }
    }

    /**
     * Crée une nouvelle ville
     */
    private createVille(data: { regionUuid: string; libelle: string; codePostal?: string }): void {
        this.updateState({ loading: true });

        this.villeService.createVille$(data).subscribe({
            next: (response) => {
                const newVille = response.data.ville;
                if (newVille) {
                    this.updateState({
                        loading: false,
                        villes: [...this.villes(), newVille],
                        isModalOpen: false
                    });
                }
                this.villeForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Met à jour une ville
     */
    private updateVille(villeUuid: string, data: { regionUuid: string; libelle: string; codePostal?: string }): void {
        this.updateState({ loading: true });

        this.villeService.updateVille$(villeUuid, data).subscribe({
            next: (response) => {
                const updatedVille = response.data.ville;
                if (updatedVille) {
                    const updatedVilles = this.villes().map((v) => (v.villeUuid === villeUuid ? updatedVille : v));
                    this.updateState({
                        loading: false,
                        villes: updatedVilles,
                        isModalOpen: false,
                        selectedVille: null
                    });
                }
                this.villeForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Confirme le changement de statut d'une ville
     */
    confirmToggleStatus(ville: IVille): void {
        const action = ville.actif ? 'désactiver' : 'activer';
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} la ville "${ville.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.toggleVilleStatus(ville);
            }
        });
    }

    /**
     * Active ou désactive une ville
     */
    private toggleVilleStatus(ville: IVille): void {
        const newStatus = !ville.actif;

        this.villeService.updateVilleStatus$(ville.villeUuid, newStatus).subscribe({
            next: (response) => {
                const updatedVille = response.data.ville;
                if (updatedVille) {
                    const updatedVilles = this.villes().map((v) => (v.villeUuid === ville.villeUuid ? updatedVille : v));
                    this.updateState({ villes: updatedVilles });
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
    private updateState(partialState: Partial<VilleState>): void {
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
        const field = this.villeForm.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    /**
     * Récupère le message d'erreur d'un champ
     */
    getFieldError(fieldName: string): string {
        const field = this.villeForm.get(fieldName);
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
        return this.isEditMode() ? 'Modifier la ville' : 'Nouvelle ville';
    }
}
