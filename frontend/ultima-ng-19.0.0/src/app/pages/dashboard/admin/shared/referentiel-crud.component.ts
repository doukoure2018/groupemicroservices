import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
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
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ChampRef, FiltreRef, ReferentielApi, ReferentielCrudConfig } from '@/interface/referentiel-crud.config';

/**
 * Écran CRUD générique pour les référentiels « famille A » (régions, villes,
 * communes, quartiers) : stats, recherche, filtres en cascade, table paginée,
 * modal création/édition, activation/désactivation avec confirmation.
 * L'écran hôte fournit la config, un adaptateur API et le registre d'options.
 */
@Component({
    selector: 'app-referentiel-crud',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, ToastModule, ConfirmDialogModule, TagModule, TooltipModule, CardModule, ProgressSpinnerModule, DropdownModule, IconFieldModule, InputIconModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './referentiel-crud.component.html',
    styleUrl: './referentiel-crud.component.scss'
})
export class ReferentielCrudComponent implements OnInit {
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    // ===== Entrées =====
    config = input.required<ReferentielCrudConfig>();
    api = input.required<ReferentielApi>();
    /** Registre d'options pour dropdowns et filtres (listes parentes actives) */
    options = input<Record<string, any[]>>({});

    // ===== État =====
    items = signal<any[]>([]);
    loading = signal(false);
    isModalOpen = signal(false);
    isEditMode = signal(false);
    selectedItem = signal<any | null>(null);
    searchTerm = signal('');
    /** Valeur courante de chaque filtre (même index que config.filtres) */
    valeursFiltres = signal<(string | null)[]>([]);

    form!: FormGroup;

    // ===== Statistiques =====
    total = computed(() => this.items().length);
    actifs = computed(() => this.items().filter((i) => i.actif).length);
    inactifs = computed(() => this.items().filter((i) => !i.actif).length);

    // ===== Lignes filtrées =====
    filteredItems = computed(() => {
        let result = this.items();

        const filtres = this.config().filtres || [];
        const valeurs = this.valeursFiltres();
        filtres.forEach((filtre, i) => {
            const valeur = valeurs[i];
            if (valeur) result = result.filter((row) => row[filtre.rowKey] === valeur);
        });

        const term = this.searchTerm().toLowerCase();
        if (term) {
            const keys = this.config().rechercheKeys;
            result = result.filter((row) => keys.some((k) => String(row[k] ?? '').toLowerCase().includes(term)));
        }
        return result;
    });

    ngOnInit(): void {
        this.buildForm();
        this.valeursFiltres.set((this.config().filtres || []).map(() => null));
        this.load();
    }

    private buildForm(): void {
        const controls: Record<string, any> = {};
        for (const champ of this.config().champs) {
            const validators = [];
            if (champ.required) validators.push(Validators.required);
            if (champ.minLength) validators.push(Validators.minLength(champ.minLength));
            if (champ.maxLength) validators.push(Validators.maxLength(champ.maxLength));
            controls[champ.key] = ['', validators];
        }
        this.form = this.fb.group(controls);

        // Cascades : changer un champ parent réinitialise ses dépendants
        for (const champ of this.config().champs) {
            if (!champ.dependsOn) continue;
            const parent = this.form.get(champ.dependsOn.champ);
            parent?.valueChanges.subscribe(() => {
                this.form.get(champ.key)?.setValue('', { emitEvent: false });
            });
        }
    }

    load(): void {
        this.loading.set(true);
        this.api().getAll().subscribe({
            next: (data) => {
                this.items.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                this.loading.set(false);
                this.showError(error);
            }
        });
    }

    // ===== Options (formulaires et filtres) =====
    optionsPourChamp(champ: ChampRef): any[] {
        const liste = this.options()[champ.optionsKey || ''] || [];
        if (!champ.dependsOn) return liste;
        const parentValue = this.form?.get(champ.dependsOn.champ)?.value;
        if (!parentValue) return liste;
        return liste.filter((o) => o[champ.dependsOn!.matchKey] === parentValue);
    }

    optionsPourFiltre(filtre: FiltreRef): any[] {
        const liste = this.options()[filtre.optionsKey] || [];
        if (!filtre.dependsOn) return liste;
        const parentValue = this.valeursFiltres()[filtre.dependsOn.filtre];
        if (!parentValue) return liste;
        return liste.filter((o) => o[filtre.dependsOn!.matchKey] === parentValue);
    }

    onFiltreChange(index: number, valeur: string | null): void {
        this.valeursFiltres.update((valeurs) => {
            const maj = [...valeurs];
            maj[index] = valeur;
            // Réinitialiser les filtres qui dépendent de celui-ci
            (this.config().filtres || []).forEach((f, i) => {
                if (f.dependsOn?.filtre === index) maj[i] = null;
            });
            return maj;
        });
    }

    hasFiltresActifs(): boolean {
        return this.valeursFiltres().some((v) => !!v);
    }

    clearFiltres(): void {
        this.valeursFiltres.set((this.config().filtres || []).map(() => null));
        this.searchTerm.set('');
    }

    // ===== Modal =====
    openCreateModal(): void {
        this.form.reset();
        this.isEditMode.set(false);
        this.selectedItem.set(null);
        this.isModalOpen.set(true);
    }

    openEditModal(row: any): void {
        const values: Record<string, any> = {};
        for (const champ of this.config().champs) {
            values[champ.key] = row[champ.key] ?? '';
        }
        // emitEvent false : ne pas déclencher les resets de cascade pendant le patch
        this.form.reset(undefined, { emitEvent: false });
        this.form.patchValue(values, { emitEvent: false });
        this.isEditMode.set(true);
        this.selectedItem.set(row);
        this.isModalOpen.set(true);
    }

    closeModal(): void {
        this.isModalOpen.set(false);
        this.isEditMode.set(false);
        this.selectedItem.set(null);
        this.form.reset(undefined, { emitEvent: false });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        // Payload = champs non exclus (les champs d'aide de cascade ne partent pas)
        const payload: Record<string, any> = {};
        for (const champ of this.config().champs) {
            if (champ.exclu) continue;
            payload[champ.key] = this.form.value[champ.key];
        }

        this.loading.set(true);
        const uuidKey = this.config().uuidKey;

        if (this.isEditMode() && this.selectedItem()) {
            const uuid = this.selectedItem()[uuidKey];
            this.api().update(uuid, payload).subscribe({
                next: ({ item, message }) => {
                    if (item) {
                        this.items.update((list) => list.map((r) => (r[uuidKey] === uuid ? item : r)));
                    }
                    this.loading.set(false);
                    this.closeModal();
                    this.showSuccess(message);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.showError(error);
                }
            });
        } else {
            this.api().create(payload).subscribe({
                next: ({ item, message }) => {
                    if (item) {
                        this.items.update((list) => [...list, item]);
                    }
                    this.loading.set(false);
                    this.closeModal();
                    this.showSuccess(message);
                },
                error: (error) => {
                    this.loading.set(false);
                    this.showError(error);
                }
            });
        }
    }

    // ===== Statut =====
    confirmToggleStatus(row: any): void {
        const { entite, genre } = this.config();
        const action = row.actif ? 'désactiver' : 'activer';
        const article = genre === 'f' ? 'la' : 'le';
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir ${action} ${article} ${entite} "${row.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => this.toggleStatus(row)
        });
    }

    private toggleStatus(row: any): void {
        const uuidKey = this.config().uuidKey;
        this.api().updateStatus(row[uuidKey], !row.actif).subscribe({
            next: ({ item, message }) => {
                if (item) {
                    this.items.update((list) => list.map((r) => (r[uuidKey] === row[uuidKey] ? item : r)));
                }
                this.showSuccess(message);
            },
            error: (error) => this.showError(error)
        });
    }

    // ===== Libellés =====
    get modalTitle(): string {
        const { entite, genre } = this.config();
        if (this.isEditMode()) return `Modifier ${genre === 'f' ? 'la' : 'le'} ${entite}`;
        return `${genre === 'f' ? 'Nouvelle' : 'Nouveau'} ${entite}`;
    }

    get boutonCreation(): string {
        const { entite, genre } = this.config();
        const nom = entite.charAt(0).toUpperCase() + entite.slice(1);
        return `${genre === 'f' ? 'Nouvelle' : 'Nouveau'} ${nom}`;
    }

    get placeholderRecherche(): string {
        const { entite, genre } = this.config();
        return `Rechercher ${genre === 'f' ? 'une' : 'un'} ${entite}...`;
    }

    get labelActifs(): string {
        return this.config().genre === 'f' ? 'Actives' : 'Actifs';
    }

    get labelInactifs(): string {
        return this.config().genre === 'f' ? 'Inactives' : 'Inactifs';
    }

    get messageVide(): string {
        const { entite, genre } = this.config();
        return genre === 'f' ? `Aucune ${entite} trouvée` : `Aucun ${entite} trouvé`;
    }

    // ===== Utilitaires formulaire =====
    onSearchChange(event: Event): void {
        this.searchTerm.set((event.target as HTMLInputElement).value);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    getFieldError(fieldName: string): string {
        const field = this.form.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Ce champ est obligatoire';
            if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
            if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
        }
        return '';
    }

    getStatusSeverity(actif: boolean): 'success' | 'danger' {
        return actif ? 'success' : 'danger';
    }

    private showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: message, life: 3000 });
    }

    private showError(error: unknown): void {
        // Les services transforment les erreurs HTTP en string (handleError)
        const detail = typeof error === 'string' && error ? error : 'Une erreur est survenue. Veuillez réessayer.';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
    }
}
