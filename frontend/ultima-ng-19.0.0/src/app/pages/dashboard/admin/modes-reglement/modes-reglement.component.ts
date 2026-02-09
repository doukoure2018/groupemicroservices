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
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';

// Services & Models
import { ModeReglementService } from '@/service/mode-reglement.service';
import { ModeReglement, ModeReglementRequest, CODES_MODE_REGLEMENT, formatFrais, getModeReglementIcon } from '@/interface/mode-reglement.model';

@Component({
    selector: 'app-modes-reglement',
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
        CheckboxModule,
        DropdownModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './modes-reglement.component.html',
    styleUrl: './modes-reglement.component.scss'
})
export class ModesReglementComponent implements OnInit {
    private readonly modeReglementService = inject(ModeReglementService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    modesReglement = signal<ModeReglement[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    fraisDialogVisible = signal(false);
    isEditMode = signal(false);
    selectedMode = signal<ModeReglement | null>(null);
    searchQuery = signal('');

    // Options
    codesOptions = CODES_MODE_REGLEMENT;

    // Computed
    filteredModes = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.modesReglement();
        return this.modesReglement().filter((m) => m.libelle?.toLowerCase().includes(query) || m.code?.toLowerCase().includes(query) || m.description?.toLowerCase().includes(query));
    });

    totalModes = computed(() => this.modesReglement().length);
    modesActifs = computed(() => this.modesReglement().filter((m) => m.actif).length);

    // Forms
    modeForm!: FormGroup;
    fraisForm!: FormGroup;

    ngOnInit(): void {
        this.initForms();
        this.loadModes();
    }

    private initForms(): void {
        this.modeForm = this.fb.group({
            libelle: ['', [Validators.required, Validators.maxLength(50)]],
            code: ['', [Validators.required, Validators.maxLength(20)]],
            description: [''],
            iconeUrl: [''],
            fraisPourcentage: [0, [Validators.min(0), Validators.max(100)]],
            fraisFixe: [0, [Validators.min(0)]],
            actif: [true]
        });

        this.fraisForm = this.fb.group({
            fraisPourcentage: [0, [Validators.min(0), Validators.max(100)]],
            fraisFixe: [0, [Validators.min(0)]]
        });
    }

    loadModes(): void {
        this.loading.set(true);
        this.modeReglementService.getAll().subscribe({
            next: (data) => {
                this.modesReglement.set(data);
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
        this.selectedMode.set(null);
        this.modeForm.reset({ actif: true, fraisPourcentage: 0, fraisFixe: 0 });
        this.dialogVisible.set(true);
    }

    openEditDialog(mode: ModeReglement): void {
        this.isEditMode.set(true);
        this.selectedMode.set(mode);
        this.modeForm.patchValue({
            libelle: mode.libelle,
            code: mode.code,
            description: mode.description,
            iconeUrl: mode.iconeUrl,
            fraisPourcentage: mode.fraisPourcentage || 0,
            fraisFixe: mode.fraisFixe || 0,
            actif: mode.actif
        });
        this.dialogVisible.set(true);
    }

    openFraisDialog(mode: ModeReglement): void {
        this.selectedMode.set(mode);
        this.fraisForm.patchValue({
            fraisPourcentage: mode.fraisPourcentage || 0,
            fraisFixe: mode.fraisFixe || 0
        });
        this.fraisDialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.modeForm.reset();
    }

    closeFraisDialog(): void {
        this.fraisDialogVisible.set(false);
        this.fraisForm.reset();
    }

    saveMode(): void {
        if (this.modeForm.invalid) {
            this.modeForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir les champs obligatoires' });
            return;
        }

        const request: ModeReglementRequest = this.modeForm.value;
        this.loading.set(true);

        if (this.isEditMode() && this.selectedMode()) {
            this.modeReglementService.update(this.selectedMode()!.modeReglementUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Mode mis à jour' });
                    this.loadModes();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        } else {
            this.modeReglementService.create(request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Mode créé' });
                    this.loadModes();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        }
    }

    saveFrais(): void {
        if (!this.selectedMode()) return;

        const { fraisPourcentage, fraisFixe } = this.fraisForm.value;
        this.loading.set(true);

        this.modeReglementService.updateFrais(this.selectedMode()!.modeReglementUuid!, fraisPourcentage, fraisFixe).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Frais mis à jour' });
                this.loadModes();
                this.closeFraisDialog();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    toggleActif(mode: ModeReglement): void {
        this.modeReglementService.toggleActif(mode.modeReglementUuid!).subscribe({
            next: (updated) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: updated.actif ? 'Mode activé' : 'Mode désactivé'
                });
                this.loadModes();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    confirmDelete(mode: ModeReglement): void {
        this.confirmationService.confirm({
            message: `Supprimer le mode "${mode.libelle}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteMode(mode)
        });
    }

    private deleteMode(mode: ModeReglement): void {
        this.modeReglementService.delete(mode.modeReglementUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Mode supprimé' });
                this.loadModes();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    onSearch(event: Event): void {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    onCodeSelect(event: any): void {
        const selected = this.codesOptions.find((c) => c.value === event.value);
        if (selected && !this.isEditMode()) {
            this.modeForm.patchValue({ libelle: selected.label });
        }
    }

    formatFrais = formatFrais;
    getModeIcon = getModeReglementIcon;
}
