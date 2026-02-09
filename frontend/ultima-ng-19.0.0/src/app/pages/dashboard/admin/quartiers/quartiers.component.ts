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
import { IQuartier } from '@/interface/quartier';
import { ICommune } from '@/interface/commune';
import { QuartierService } from '@/service/quartier.service';
import { CommuneService } from '@/service/commune.service';

interface QuartierState {
    loading: boolean;
    quartiers: IQuartier[];
    communes: ICommune[];
    villes: IVille[];
    selectedQuartier: IQuartier | null;
    selectedVilleFilter: IVille | null;
    selectedCommuneFilter: ICommune | null;
    isModalOpen: boolean;
    isEditMode: boolean;
}

@Component({
    selector: 'app-quartiers',
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
    templateUrl: './quartiers.component.html',
    styleUrl: './quartiers.component.scss'
})
export class QuartiersComponent implements OnInit {
    private quartierService = inject(QuartierService);
    private communeService = inject(CommuneService);
    private villeService = inject(VilleService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    // Signal pour l'état global
    state = signal<QuartierState>({
        loading: false,
        quartiers: [],
        communes: [],
        villes: [],
        selectedQuartier: null,
        selectedVilleFilter: null,
        selectedCommuneFilter: null,
        isModalOpen: false,
        isEditMode: false
    });

    // Signaux calculés
    quartiers = computed(() => this.state().quartiers);
    communes = computed(() => this.state().communes);
    villes = computed(() => this.state().villes);
    loading = computed(() => this.state().loading);
    isModalOpen = computed(() => this.state().isModalOpen);
    isEditMode = computed(() => this.state().isEditMode);
    selectedQuartier = computed(() => this.state().selectedQuartier);
    selectedVilleFilter = computed(() => this.state().selectedVilleFilter);
    selectedCommuneFilter = computed(() => this.state().selectedCommuneFilter);

    // Statistiques calculées
    totalQuartiers = computed(() => this.state().quartiers.length);
    activeQuartiers = computed(() => this.state().quartiers.filter((q) => q.actif).length);
    inactiveQuartiers = computed(() => this.state().quartiers.filter((q) => !q.actif).length);

    // Entités actives pour les dropdowns
    activeVilles = computed(() => this.state().villes.filter((v) => v.actif));
    activeCommunes = computed(() => this.state().communes.filter((c) => c.actif));

    // Communes filtrées par ville sélectionnée (pour le modal)
    filteredCommunesForModal = computed(() => {
        const selectedVilleUuid = this.selectedModalVille();
        if (!selectedVilleUuid) {
            return this.activeCommunes();
        }
        return this.activeCommunes().filter((c) => c.villeUuid === selectedVilleUuid);
    });

    // Communes filtrées par ville pour le filtre de tableau
    filteredCommunesForFilter = computed(() => {
        const villeFilter = this.selectedVilleFilter();
        if (!villeFilter) {
            return this.activeCommunes();
        }
        return this.activeCommunes().filter((c) => c.villeUuid === villeFilter.villeUuid);
    });

    // Formulaire
    quartierForm!: FormGroup;

    // Signal pour la recherche
    searchTerm = signal<string>('');

    // Signal pour la ville sélectionnée dans le modal
    selectedModalVille = signal<string>('');

    // Quartiers filtrés
    filteredQuartiers = computed(() => {
        let result = this.quartiers();

        // Filtre par ville
        const villeFilter = this.selectedVilleFilter();
        if (villeFilter) {
            result = result.filter((q) => q.villeUuid === villeFilter.villeUuid);
        }

        // Filtre par commune
        const communeFilter = this.selectedCommuneFilter();
        if (communeFilter) {
            result = result.filter((q) => q.communeUuid === communeFilter.communeUuid);
        }

        // Filtre par recherche
        const term = this.searchTerm().toLowerCase();
        if (term) {
            result = result.filter(
                (quartier) => quartier.libelle.toLowerCase().includes(term) || quartier.communeLibelle?.toLowerCase().includes(term) || quartier.villeLibelle?.toLowerCase().includes(term) || quartier.regionLibelle?.toLowerCase().includes(term)
            );
        }

        return result;
    });

    ngOnInit(): void {
        this.initForm();
        this.loadVilles();
        this.loadCommunes();
        this.loadQuartiers();
    }

    private initForm(): void {
        this.quartierForm = this.fb.group({
            villeUuid: [''],
            communeUuid: ['', [Validators.required]],
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
        });

        // Écouter les changements de ville pour mettre à jour les communes
        this.quartierForm.get('villeUuid')?.valueChanges.subscribe((value) => {
            this.selectedModalVille.set(value || '');
            // Réinitialiser la commune sélectionnée
            this.quartierForm.patchValue({ communeUuid: '' }, { emitEvent: false });
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
        this.communeService.getAllCommunes$().subscribe({
            next: (response) => {
                this.updateState({
                    communes: response.data.communes || []
                });
            },
            error: (error) => {
                this.showError('Erreur lors du chargement des communes: ' + error);
            }
        });
    }

    /**
     * Charge tous les quartiers
     */
    loadQuartiers(): void {
        this.updateState({ loading: true });

        this.quartierService.getAllQuartiers$().subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    quartiers: response.data.quartiers || []
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
        this.updateState({
            selectedVilleFilter: ville,
            selectedCommuneFilter: null // Réinitialiser le filtre commune
        });
    }

    /**
     * Filtre par commune
     */
    onCommuneFilterChange(commune: ICommune | null): void {
        this.updateState({ selectedCommuneFilter: commune });
    }

    /**
     * Efface les filtres
     */
    clearFilters(): void {
        this.updateState({
            selectedVilleFilter: null,
            selectedCommuneFilter: null
        });
    }

    /**
     * Ouvre le modal pour créer un quartier
     */
    openCreateModal(): void {
        this.quartierForm.reset();
        this.selectedModalVille.set('');
        this.updateState({
            isModalOpen: true,
            isEditMode: false,
            selectedQuartier: null
        });
    }

    /**
     * Ouvre le modal pour éditer un quartier
     */
    openEditModal(quartier: IQuartier): void {
        this.selectedModalVille.set(quartier.villeUuid);
        this.quartierForm.patchValue({
            villeUuid: quartier.villeUuid,
            communeUuid: quartier.communeUuid,
            libelle: quartier.libelle
        });
        this.updateState({
            isModalOpen: true,
            isEditMode: true,
            selectedQuartier: quartier
        });
    }

    /**
     * Ferme le modal
     */
    closeModal(): void {
        this.updateState({
            isModalOpen: false,
            isEditMode: false,
            selectedQuartier: null
        });
        this.quartierForm.reset();
        this.selectedModalVille.set('');
    }

    /**
     * Soumet le formulaire
     */
    onSubmit(): void {
        if (this.quartierForm.invalid) {
            this.quartierForm.markAllAsTouched();
            return;
        }

        const formData = {
            communeUuid: this.quartierForm.value.communeUuid,
            libelle: this.quartierForm.value.libelle
        };

        if (this.isEditMode() && this.selectedQuartier()) {
            this.updateQuartier(this.selectedQuartier()!.quartierUuid, formData);
        } else {
            this.createQuartier(formData);
        }
    }

    /**
     * Crée un nouveau quartier
     */
    private createQuartier(data: { communeUuid: string; libelle: string }): void {
        this.updateState({ loading: true });

        this.quartierService.createQuartier$(data).subscribe({
            next: (response) => {
                const newQuartier = response.data.quartier;
                if (newQuartier) {
                    this.updateState({
                        loading: false,
                        quartiers: [...this.quartiers(), newQuartier],
                        isModalOpen: false
                    });
                }
                this.quartierForm.reset();
                this.selectedModalVille.set('');
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Met à jour un quartier
     */
    private updateQuartier(quartierUuid: string, data: { communeUuid: string; libelle: string }): void {
        this.updateState({ loading: true });

        this.quartierService.updateQuartier$(quartierUuid, data).subscribe({
            next: (response) => {
                const updatedQuartier = response.data.quartier;
                if (updatedQuartier) {
                    const updatedQuartiers = this.quartiers().map((q) => (q.quartierUuid === quartierUuid ? updatedQuartier : q));
                    this.updateState({
                        loading: false,
                        quartiers: updatedQuartiers,
                        isModalOpen: false,
                        selectedQuartier: null
                    });
                }
                this.quartierForm.reset();
                this.selectedModalVille.set('');
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
    confirmToggleStatus(quartier: IQuartier): void {
        const action = quartier.actif ? 'désactiver' : 'activer';
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} le quartier "${quartier.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.toggleQuartierStatus(quartier);
            }
        });
    }

    /**
     * Active ou désactive un quartier
     */
    private toggleQuartierStatus(quartier: IQuartier): void {
        const newStatus = !quartier.actif;

        this.quartierService.updateQuartierStatus$(quartier.quartierUuid, newStatus).subscribe({
            next: (response) => {
                const updatedQuartier = response.data.quartier;
                if (updatedQuartier) {
                    const updatedQuartiers = this.quartiers().map((q) => (q.quartierUuid === quartier.quartierUuid ? updatedQuartier : q));
                    this.updateState({ quartiers: updatedQuartiers });
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
    private updateState(partialState: Partial<QuartierState>): void {
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
        const field = this.quartierForm.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    /**
     * Récupère le message d'erreur
     */
    getFieldError(fieldName: string): string {
        const field = this.quartierForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Ce champ est obligatoire';
            if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
            if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
        }
        return '';
    }

    /**
     * Vérifie si des filtres sont actifs
     */
    hasActiveFilters(): boolean {
        return !!(this.selectedVilleFilter() || this.selectedCommuneFilter());
    }

    /**
     * Titre du modal
     */
    get modalTitle(): string {
        return this.isEditMode() ? 'Modifier le quartier' : 'Nouveau quartier';
    }
}
