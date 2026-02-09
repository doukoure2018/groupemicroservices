import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';

// Services & Models
import { TypeVehiculeService } from '@/service/type-vehicule.service';
import { TypeVehicule, TypeVehiculeRequest } from '@/interface/type-vehicule.model';

@Component({
    selector: 'app-types-vehicules',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        InputNumberModule,
        TextareaModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        CardModule,
        IconFieldModule,
        InputIconModule,
        CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './types-vehicules.component.html',
    styleUrl: './types-vehicules.component.scss'
})
export class TypesVehiculesComponent implements OnInit {
    private readonly typeVehiculeService = inject(TypeVehiculeService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    typesVehicules = signal<TypeVehicule[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    isEditMode = signal(false);
    selectedType = signal<TypeVehicule | null>(null);
    searchQuery = signal('');

    // Computed
    filteredTypes = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.typesVehicules();
        return this.typesVehicules().filter((type) => type.libelle?.toLowerCase().includes(query) || type.description?.toLowerCase().includes(query));
    });

    totalTypes = computed(() => this.typesVehicules().length);
    typesActifs = computed(() => this.typesVehicules().filter((t) => t.actif).length);

    // Form
    typeForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadTypes();
    }

    private initForm(): void {
        this.typeForm = this.fb.group({
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            description: [''],
            capaciteMin: [null, [Validators.min(1), Validators.max(100)]],
            capaciteMax: [null, [Validators.min(1), Validators.max(100)]],
            actif: [true]
        });
    }

    loadTypes(): void {
        this.loading.set(true);
        this.typeVehiculeService.getAll().subscribe({
            next: (data) => {
                this.typesVehicules.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedType.set(null);
        this.typeForm.reset({ actif: true });
        this.dialogVisible.set(true);
    }

    openEditDialog(type: TypeVehicule): void {
        this.isEditMode.set(true);
        this.selectedType.set(type);
        this.typeForm.patchValue({
            libelle: type.libelle,
            description: type.description,
            capaciteMin: type.capaciteMin,
            capaciteMax: type.capaciteMax,
            actif: type.actif
        });
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.typeForm.reset();
    }

    saveType(): void {
        if (this.typeForm.invalid) {
            this.typeForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir les champs obligatoires' });
            return;
        }

        // Validation capacité
        const { capaciteMin, capaciteMax } = this.typeForm.value;
        if (capaciteMin && capaciteMax && capaciteMin > capaciteMax) {
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'La capacité min doit être inférieure à la capacité max' });
            return;
        }

        const request: TypeVehiculeRequest = this.typeForm.value;
        this.loading.set(true);

        if (this.isEditMode() && this.selectedType()) {
            this.typeVehiculeService.update(this.selectedType()!.typeVehiculeUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Type mis à jour' });
                    this.loadTypes();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        } else {
            this.typeVehiculeService.create(request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Type créé' });
                    this.loadTypes();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        }
    }

    toggleActif(type: TypeVehicule): void {
        this.typeVehiculeService.toggleActif(type.typeVehiculeUuid!).subscribe({
            next: (updated) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: updated.actif ? 'Type activé' : 'Type désactivé'
                });
                this.loadTypes();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    confirmDelete(type: TypeVehicule): void {
        this.confirmationService.confirm({
            message: `Supprimer le type "${type.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteType(type)
        });
    }

    private deleteType(type: TypeVehicule): void {
        this.typeVehiculeService.delete(type.typeVehiculeUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Type supprimé' });
                this.loadTypes();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    onSearch(event: Event): void {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    formatCapacite(type: TypeVehicule): string {
        if (type.capaciteMin && type.capaciteMax) {
            return `${type.capaciteMin} - ${type.capaciteMax} places`;
        }
        if (type.capaciteMin) return `Min ${type.capaciteMin} places`;
        if (type.capaciteMax) return `Max ${type.capaciteMax} places`;
        return '-';
    }
}
