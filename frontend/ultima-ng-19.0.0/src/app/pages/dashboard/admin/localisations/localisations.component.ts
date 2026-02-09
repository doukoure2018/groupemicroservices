import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalisationService } from '@/service/localisation.service';
import { OpenStreetMapService } from '@/service/openstreetmap.service';
import { QuartierService } from '@/service/quartier.service';
import { CommuneService } from '@/service/commune.service';
import { VilleService } from '@/service/ville.service';
import { ILocalisation, IPlacePrediction } from '@/interface/localisation';
import { IQuartier } from '@/interface/quartier';
import { ICommune } from '@/interface/commune';
import { IVille } from '@/interface/ville';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
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
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface LocalisationState {
    loading: boolean;
    localisations: ILocalisation[];
    quartiers: IQuartier[];
    communes: ICommune[];
    villes: IVille[];
    selectedLocalisation: ILocalisation | null;
    selectedVilleFilter: IVille | null;
    selectedCommuneFilter: ICommune | null;
    selectedQuartierFilter: IQuartier | null;
    isModalOpen: boolean;
    isEditMode: boolean;
    isMapModalOpen: boolean;
    mapLocalisation: ILocalisation | null;
}

@Component({
    selector: 'app-localisations',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputTextarea,
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
        InputNumberModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './localisations.component.html',
    styleUrl: './localisations.component.scss'
})
export class LocalisationsComponent implements OnInit {
    private localisationService = inject(LocalisationService);
    private osmService = inject(OpenStreetMapService);
    private quartierService = inject(QuartierService);
    private communeService = inject(CommuneService);
    private villeService = inject(VilleService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private sanitizer = inject(DomSanitizer);

    // Signal pour l'état global
    state = signal<LocalisationState>({
        loading: false,
        localisations: [],
        quartiers: [],
        communes: [],
        villes: [],
        selectedLocalisation: null,
        selectedVilleFilter: null,
        selectedCommuneFilter: null,
        selectedQuartierFilter: null,
        isModalOpen: false,
        isEditMode: false,
        isMapModalOpen: false,
        mapLocalisation: null
    });

    // Signaux calculés
    localisations = computed(() => this.state().localisations);
    quartiers = computed(() => this.state().quartiers);
    communes = computed(() => this.state().communes);
    villes = computed(() => this.state().villes);
    loading = computed(() => this.state().loading);
    isModalOpen = computed(() => this.state().isModalOpen);
    isEditMode = computed(() => this.state().isEditMode);
    isMapModalOpen = computed(() => this.state().isMapModalOpen);
    mapLocalisation = computed(() => this.state().mapLocalisation);
    selectedLocalisation = computed(() => this.state().selectedLocalisation);
    selectedVilleFilter = computed(() => this.state().selectedVilleFilter);
    selectedCommuneFilter = computed(() => this.state().selectedCommuneFilter);
    selectedQuartierFilter = computed(() => this.state().selectedQuartierFilter);

    // Statistiques calculées
    totalLocalisations = computed(() => this.state().localisations.length);
    localisationsWithQuartier = computed(() => this.state().localisations.filter((l) => l.quartierId !== null).length);
    localisationsWithCoords = computed(() => this.state().localisations.filter((l) => l.latitude !== null && l.longitude !== null).length);

    // Entités actives pour les dropdowns
    activeVilles = computed(() => this.state().villes.filter((v) => v.actif));
    activeCommunes = computed(() => this.state().communes.filter((c) => c.actif));
    activeQuartiers = computed(() => this.state().quartiers.filter((q) => q.actif));

    // Communes filtrées par ville (pour les filtres)
    filteredCommunesForFilter = computed(() => {
        const villeFilter = this.selectedVilleFilter();
        if (!villeFilter) return this.activeCommunes();
        return this.activeCommunes().filter((c) => c.villeUuid === villeFilter.villeUuid);
    });

    // Quartiers filtrés par commune (pour les filtres)
    filteredQuartiersForFilter = computed(() => {
        const communeFilter = this.selectedCommuneFilter();
        if (!communeFilter) {
            const villeFilter = this.selectedVilleFilter();
            if (!villeFilter) return this.activeQuartiers();
            return this.activeQuartiers().filter((q) => q.villeUuid === villeFilter.villeUuid);
        }
        return this.activeQuartiers().filter((q) => q.communeUuid === communeFilter.communeUuid);
    });

    // Quartiers filtrés pour le modal
    filteredQuartiersForModal = computed(() => {
        const selectedVilleUuid = this.selectedModalVille();
        const selectedCommuneUuid = this.selectedModalCommune();

        if (selectedCommuneUuid) {
            return this.activeQuartiers().filter((q) => q.communeUuid === selectedCommuneUuid);
        }
        if (selectedVilleUuid) {
            return this.activeQuartiers().filter((q) => q.villeUuid === selectedVilleUuid);
        }
        return this.activeQuartiers();
    });

    // Communes filtrées pour le modal
    filteredCommunesForModal = computed(() => {
        const selectedVilleUuid = this.selectedModalVille();
        if (!selectedVilleUuid) return this.activeCommunes();
        return this.activeCommunes().filter((c) => c.villeUuid === selectedVilleUuid);
    });

    // Formulaire
    localisationForm!: FormGroup;

    // Signal pour la recherche dans la table
    searchTerm = signal<string>('');

    // Signaux pour les sélections dans le modal
    selectedModalVille = signal<string>('');
    selectedModalCommune = signal<string>('');

    // OpenStreetMap - Champ de recherche séparé
    searchQuery: string = ''; // Champ de recherche (ngModel)
    addressSuggestions = signal<IPlacePrediction[]>([]);
    loadingAddress = signal<boolean>(false);
    searchPerformed = signal<boolean>(false);

    // Localisations filtrées
    filteredLocalisations = computed(() => {
        let result = this.localisations();

        // Filtre par quartier (prioritaire)
        const quartierFilter = this.selectedQuartierFilter();
        if (quartierFilter) {
            result = result.filter((l) => l.quartierUuid === quartierFilter.quartierUuid);
            return this.applySearchFilter(result);
        }

        // Filtre par commune
        const communeFilter = this.selectedCommuneFilter();
        if (communeFilter) {
            result = result.filter((l) => l.communeUuid === communeFilter.communeUuid);
            return this.applySearchFilter(result);
        }

        // Filtre par ville
        const villeFilter = this.selectedVilleFilter();
        if (villeFilter) {
            result = result.filter((l) => l.villeUuid === villeFilter.villeUuid);
            return this.applySearchFilter(result);
        }

        return this.applySearchFilter(result);
    });

    private applySearchFilter(localisations: ILocalisation[]): ILocalisation[] {
        const term = this.searchTerm().toLowerCase();
        if (!term) return localisations;

        return localisations.filter(
            (l) =>
                l.adresseComplete.toLowerCase().includes(term) ||
                l.description?.toLowerCase().includes(term) ||
                l.quartierLibelle?.toLowerCase().includes(term) ||
                l.communeLibelle?.toLowerCase().includes(term) ||
                l.villeLibelle?.toLowerCase().includes(term) ||
                l.regionLibelle?.toLowerCase().includes(term)
        );
    }

    ngOnInit(): void {
        this.initForm();
        this.loadVilles();
        this.loadCommunes();
        this.loadQuartiers();
        this.loadLocalisations();
    }

    private initForm(): void {
        this.localisationForm = this.fb.group({
            villeUuid: [''],
            communeUuid: [''],
            quartierUuid: [''],
            adresseComplete: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
            latitude: [null],
            longitude: [null],
            description: ['', [Validators.maxLength(1000)]],
            removeQuartier: [false]
        });

        // Écouter les changements de ville
        this.localisationForm.get('villeUuid')?.valueChanges.subscribe((value) => {
            this.selectedModalVille.set(value || '');
            this.localisationForm.patchValue({ communeUuid: '', quartierUuid: '' }, { emitEvent: false });
            this.selectedModalCommune.set('');
        });

        // Écouter les changements de commune
        this.localisationForm.get('communeUuid')?.valueChanges.subscribe((value) => {
            this.selectedModalCommune.set(value || '');
            this.localisationForm.patchValue({ quartierUuid: '' }, { emitEvent: false });
        });
    }

    /**
     * Charge les données
     */
    loadVilles(): void {
        this.villeService.getAllVilles$().subscribe({
            next: (response) => this.updateState({ villes: response.data.villes || [] }),
            error: (error) => this.showError('Erreur chargement villes: ' + error)
        });
    }

    loadCommunes(): void {
        this.communeService.getAllCommunes$().subscribe({
            next: (response) => this.updateState({ communes: response.data.communes || [] }),
            error: (error) => this.showError('Erreur chargement communes: ' + error)
        });
    }

    loadQuartiers(): void {
        this.quartierService.getAllQuartiers$().subscribe({
            next: (response) => this.updateState({ quartiers: response.data.quartiers || [] }),
            error: (error) => this.showError('Erreur chargement quartiers: ' + error)
        });
    }

    loadLocalisations(): void {
        this.updateState({ loading: true });
        this.localisationService.getAllLocalisations$().subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    localisations: response.data.localisations || []
                });
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    /**
     * Gestion des filtres
     */
    onVilleFilterChange(ville: IVille | null): void {
        this.updateState({
            selectedVilleFilter: ville,
            selectedCommuneFilter: null,
            selectedQuartierFilter: null
        });
    }

    onCommuneFilterChange(commune: ICommune | null): void {
        this.updateState({
            selectedCommuneFilter: commune,
            selectedQuartierFilter: null
        });
    }

    onQuartierFilterChange(quartier: IQuartier | null): void {
        this.updateState({ selectedQuartierFilter: quartier });
    }

    clearFilters(): void {
        this.updateState({
            selectedVilleFilter: null,
            selectedCommuneFilter: null,
            selectedQuartierFilter: null
        });
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedVilleFilter() || this.selectedCommuneFilter() || this.selectedQuartierFilter());
    }

    /**
     * Recherche d'adresse OpenStreetMap
     */
    forceSearchAddress(): void {
        const query = this.searchQuery?.trim();

        if (!query || query.length < 2) {
            this.showError('Entrez au moins 2 caractères pour rechercher');
            return;
        }

        console.log('🔍 Recherche:', query);
        this.loadingAddress.set(true);
        this.searchPerformed.set(true);

        this.osmService.searchGuinea$(query).subscribe({
            next: (suggestions) => {
                console.log('✅ Résultats:', suggestions);
                this.addressSuggestions.set(suggestions);
                this.loadingAddress.set(false);

                if (suggestions.length === 0) {
                    this.showInfo('Aucun résultat trouvé pour "' + query + '"');
                } else {
                    this.showSuccess(suggestions.length + ' résultat(s) trouvé(s)');
                }
            },
            error: (error) => {
                console.error('❌ Erreur:', error);
                this.addressSuggestions.set([]);
                this.loadingAddress.set(false);
                this.showError('Erreur lors de la recherche');
            }
        });
    }

    /**
     * Sélection d'une adresse dans la liste
     */
    selectAddress(place: IPlacePrediction): void {
        console.log('📍 Adresse sélectionnée:', place);

        // Mettre à jour le formulaire
        this.localisationForm.patchValue({
            adresseComplete: place.description,
            latitude: place.latitude || null,
            longitude: place.longitude || null
        });

        // Message de confirmation
        if (place.latitude && place.longitude) {
            this.showSuccess(`Adresse sélectionnée avec coordonnées GPS`);
        } else {
            this.showInfo('Adresse sélectionnée (sans coordonnées GPS)');
        }

        // Effacer les suggestions après sélection
        this.addressSuggestions.set([]);
        this.searchQuery = '';
    }

    /**
     * Modals
     */
    openCreateModal(): void {
        this.localisationForm.reset();
        this.selectedModalVille.set('');
        this.selectedModalCommune.set('');
        this.addressSuggestions.set([]);
        this.searchQuery = '';
        this.searchPerformed.set(false);
        this.updateState({
            isModalOpen: true,
            isEditMode: false,
            selectedLocalisation: null
        });
    }

    openEditModal(localisation: ILocalisation): void {
        this.selectedModalVille.set(localisation.villeUuid || '');
        this.selectedModalCommune.set(localisation.communeUuid || '');

        this.localisationForm.patchValue({
            villeUuid: localisation.villeUuid || '',
            communeUuid: localisation.communeUuid || '',
            quartierUuid: localisation.quartierUuid || '',
            adresseComplete: localisation.adresseComplete,
            latitude: localisation.latitude,
            longitude: localisation.longitude,
            description: localisation.description || '',
            removeQuartier: false
        });

        this.addressSuggestions.set([]);
        this.searchQuery = '';
        this.searchPerformed.set(false);

        this.updateState({
            isModalOpen: true,
            isEditMode: true,
            selectedLocalisation: localisation
        });
    }

    closeModal(): void {
        this.updateState({
            isModalOpen: false,
            isEditMode: false,
            selectedLocalisation: null
        });
        this.localisationForm.reset();
        this.selectedModalVille.set('');
        this.selectedModalCommune.set('');
        this.addressSuggestions.set([]);
        this.searchQuery = '';
        this.searchPerformed.set(false);
    }

    openMapModal(localisation: ILocalisation): void {
        this.updateState({
            isMapModalOpen: true,
            mapLocalisation: localisation
        });
    }

    closeMapModal(): void {
        this.updateState({
            isMapModalOpen: false,
            mapLocalisation: null
        });
    }

    /**
     * CRUD Operations
     */
    onSubmit(): void {
        if (this.localisationForm.invalid) {
            this.localisationForm.markAllAsTouched();
            return;
        }

        const formValue = this.localisationForm.value;

        if (this.isEditMode() && this.selectedLocalisation()) {
            const updateData = {
                quartierUuid: formValue.quartierUuid || null,
                removeQuartier: formValue.removeQuartier || false,
                adresseComplete: formValue.adresseComplete,
                latitude: formValue.latitude,
                longitude: formValue.longitude,
                description: formValue.description || null
            };
            this.updateLocalisation(this.selectedLocalisation()!.localisationUuid, updateData);
        } else {
            const createData = {
                quartierUuid: formValue.quartierUuid || null,
                adresseComplete: formValue.adresseComplete,
                latitude: formValue.latitude,
                longitude: formValue.longitude,
                description: formValue.description || null
            };
            this.createLocalisation(createData);
        }
    }

    private createLocalisation(data: any): void {
        this.updateState({ loading: true });
        this.localisationService.createLocalisation$(data).subscribe({
            next: (response) => {
                const newLocalisation = response.data.localisation;
                if (newLocalisation) {
                    this.updateState({
                        loading: false,
                        localisations: [...this.localisations(), newLocalisation],
                        isModalOpen: false
                    });
                }
                this.localisationForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    private updateLocalisation(uuid: string, data: any): void {
        this.updateState({ loading: true });
        this.localisationService.updateLocalisation$(uuid, data).subscribe({
            next: (response) => {
                const updatedLocalisation = response.data.localisation;
                if (updatedLocalisation) {
                    const updated = this.localisations().map((l) => (l.localisationUuid === uuid ? updatedLocalisation : l));
                    this.updateState({
                        loading: false,
                        localisations: updated,
                        isModalOpen: false,
                        selectedLocalisation: null
                    });
                }
                this.localisationForm.reset();
                this.showSuccess(response.message);
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    confirmDelete(localisation: ILocalisation): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer la localisation "${localisation.adresseComplete}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteLocalisation(localisation)
        });
    }

    private deleteLocalisation(localisation: ILocalisation): void {
        this.localisationService.deleteLocalisation$(localisation.localisationUuid).subscribe({
            next: (response) => {
                const filtered = this.localisations().filter((l) => l.localisationUuid !== localisation.localisationUuid);
                this.updateState({ localisations: filtered });
                this.showSuccess(response.message);
            },
            error: (error) => this.showError(error)
        });
    }

    /**
     * Utilitaires
     */
    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    private updateState(partialState: Partial<LocalisationState>): void {
        this.state.update((current) => ({ ...current, ...partialState }));
    }

    private showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: message, life: 3000 });
    }

    private showError(error: string): void {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error, life: 5000 });
    }

    private showInfo(message: string): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: message, life: 4000 });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.localisationForm.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    getFieldError(fieldName: string): string {
        const field = this.localisationForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Ce champ est obligatoire';
            if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
            if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
        }
        return '';
    }

    hasCoordinates(localisation: ILocalisation): boolean {
        return localisation.latitude !== null && localisation.longitude !== null;
    }

    getMapUrl(localisation: ILocalisation): SafeResourceUrl {
        if (!this.hasCoordinates(localisation)) return '';
        const url = this.osmService.getMapEmbedUrl(localisation.latitude!, localisation.longitude!);
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    openInOpenStreetMap(localisation: ILocalisation): void {
        if (this.hasCoordinates(localisation)) {
            const url = this.osmService.getOpenStreetMapUrl(localisation.latitude!, localisation.longitude!);
            window.open(url, '_blank');
        }
    }

    get modalTitle(): string {
        return this.isEditMode() ? 'Modifier la localisation' : 'Nouvelle localisation';
    }

    /**
     * Vérifie si des coordonnées sont présentes dans le formulaire
     */
    hasFormCoordinates(): boolean {
        const lat = this.localisationForm.get('latitude')?.value;
        const lng = this.localisationForm.get('longitude')?.value;
        return lat !== null && lng !== null;
    }
}
