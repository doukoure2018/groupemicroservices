import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { CalendarModule } from 'primeng/calendar';

// Services & Models
import { PartenaireService } from '@/service/partenaire.service';
import { LocalisationService } from '@/service/localisation.service';
import { Partenaire, PartenaireRequest, TYPES_PARTENAIRE, STATUTS_PARTENAIRE, getStatutPartenaireSeverity, getTypePartenaireLabel, formatCommission } from '@/interface/partenaire.model';
import { ILocalisation } from '@/interface/localisation';
import { IResponse } from '@/interface/response';

@Component({
    selector: 'app-partenaires',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        DropdownModule,
        InputNumberModule,
        TextareaModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        CardModule,
        IconFieldModule,
        InputIconModule,
        DividerModule,
        CalendarModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './partenaires.component.html',
    styleUrl: './partenaires.component.scss'
})
export class PartenairesComponent implements OnInit {
    private readonly partenaireService = inject(PartenaireService);
    private readonly localisationService = inject(LocalisationService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    partenaires = signal<Partenaire[]>([]);
    localisations = signal<ILocalisation[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    commissionsDialogVisible = signal(false);
    isEditMode = signal(false);
    selectedPartenaire = signal<Partenaire | null>(null);
    searchQuery = signal('');

    // Options
    typesPartenaire = TYPES_PARTENAIRE;
    statutsPartenaire = STATUTS_PARTENAIRE;

    // Computed
    filteredPartenaires = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.partenaires();
        return this.partenaires().filter((p) => p.nom?.toLowerCase().includes(query) || p.typePartenaire?.toLowerCase().includes(query) || p.villeLibelle?.toLowerCase().includes(query) || p.responsableNom?.toLowerCase().includes(query));
    });

    totalPartenaires = computed(() => this.partenaires().length);
    partenairesActifs = computed(() => this.partenaires().filter((p) => p.statut === 'ACTIF').length);
    partenairesEnAttente = computed(() => this.partenaires().filter((p) => p.statut === 'EN_ATTENTE').length);

    // Forms
    partenaireForm!: FormGroup;
    commissionsForm!: FormGroup;

    ngOnInit(): void {
        this.initForms();
        this.loadPartenaires();
        this.loadLocalisations();
    }

    private initForms(): void {
        this.partenaireForm = this.fb.group({
            localisationUuid: [''],
            nom: ['', [Validators.required, Validators.maxLength(100)]],
            typePartenaire: ['AGENCE'],
            raisonSociale: [''],
            numeroRegistre: [''],
            telephone: ['', Validators.maxLength(20)],
            email: ['', [Validators.email, Validators.maxLength(100)]],
            adresse: [''],
            logoUrl: [''],
            commissionPourcentage: [0, [Validators.min(0), Validators.max(100)]],
            commissionFixe: [0, [Validators.min(0)]],
            responsableNom: [''],
            responsableTelephone: [''],
            dateDebutPartenariat: [null],
            dateFinPartenariat: [null]
        });

        this.commissionsForm = this.fb.group({
            commissionPourcentage: [0, [Validators.min(0), Validators.max(100)]],
            commissionFixe: [0, [Validators.min(0)]]
        });
    }

    loadPartenaires(): void {
        this.loading.set(true);
        this.partenaireService.getAll().subscribe({
            next: (data) => {
                this.partenaires.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    loadLocalisations(): void {
        this.localisationService.getAllLocalisations$().subscribe({
            next: (response: IResponse) => {
                this.localisations.set(response.data?.localisations || []);
            },
            error: (err) => console.error('Erreur chargement localisations:', err)
        });
    }

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedPartenaire.set(null);
        this.partenaireForm.reset({ typePartenaire: 'AGENCE', commissionPourcentage: 0, commissionFixe: 0 });
        this.dialogVisible.set(true);
    }

    openEditDialog(partenaire: Partenaire): void {
        this.isEditMode.set(true);
        this.selectedPartenaire.set(partenaire);
        this.partenaireForm.patchValue({
            localisationUuid: partenaire.localisationUuid,
            nom: partenaire.nom,
            typePartenaire: partenaire.typePartenaire,
            raisonSociale: partenaire.raisonSociale,
            numeroRegistre: partenaire.numeroRegistre,
            telephone: partenaire.telephone,
            email: partenaire.email,
            adresse: partenaire.adresse,
            logoUrl: partenaire.logoUrl,
            commissionPourcentage: partenaire.commissionPourcentage || 0,
            commissionFixe: partenaire.commissionFixe || 0,
            responsableNom: partenaire.responsableNom,
            responsableTelephone: partenaire.responsableTelephone,
            dateDebutPartenariat: partenaire.dateDebutPartenariat ? new Date(partenaire.dateDebutPartenariat) : null,
            dateFinPartenariat: partenaire.dateFinPartenariat ? new Date(partenaire.dateFinPartenariat) : null
        });
        this.dialogVisible.set(true);
    }

    openCommissionsDialog(partenaire: Partenaire): void {
        this.selectedPartenaire.set(partenaire);
        this.commissionsForm.patchValue({
            commissionPourcentage: partenaire.commissionPourcentage || 0,
            commissionFixe: partenaire.commissionFixe || 0
        });
        this.commissionsDialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.partenaireForm.reset();
    }

    closeCommissionsDialog(): void {
        this.commissionsDialogVisible.set(false);
        this.commissionsForm.reset();
    }

    savePartenaire(): void {
        if (this.partenaireForm.invalid) {
            this.partenaireForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir les champs obligatoires' });
            return;
        }

        const formValue = this.partenaireForm.value;
        const request: PartenaireRequest = {
            ...formValue,
            dateDebutPartenariat: formValue.dateDebutPartenariat ? this.formatDate(formValue.dateDebutPartenariat) : null,
            dateFinPartenariat: formValue.dateFinPartenariat ? this.formatDate(formValue.dateFinPartenariat) : null
        };

        this.loading.set(true);

        if (this.isEditMode() && this.selectedPartenaire()) {
            this.partenaireService.update(this.selectedPartenaire()!.partenaireUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Partenaire mis à jour' });
                    this.loadPartenaires();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        } else {
            this.partenaireService.create(request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Partenaire créé' });
                    this.loadPartenaires();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        }
    }

    saveCommissions(): void {
        if (!this.selectedPartenaire()) return;

        const { commissionPourcentage, commissionFixe } = this.commissionsForm.value;
        this.loading.set(true);

        this.partenaireService.updateCommissions(this.selectedPartenaire()!.partenaireUuid!, commissionPourcentage, commissionFixe).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Commissions mises à jour' });
                this.loadPartenaires();
                this.closeCommissionsDialog();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    changeStatut(partenaire: Partenaire, statut: string): void {
        this.partenaireService.updateStatut(partenaire.partenaireUuid!, statut).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Statut mis à jour' });
                this.loadPartenaires();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    confirmDelete(partenaire: Partenaire): void {
        this.confirmationService.confirm({
            message: `Supprimer le partenaire "${partenaire.nom}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deletePartenaire(partenaire)
        });
    }

    private deletePartenaire(partenaire: Partenaire): void {
        this.partenaireService.delete(partenaire.partenaireUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Partenaire supprimé' });
                this.loadPartenaires();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    onSearch(event: Event): void {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    getStatutSeverity = getStatutPartenaireSeverity;
    getTypeLabel = getTypePartenaireLabel;
    formatCommission = formatCommission;

    getLocalisationLabel(loc: ILocalisation): string {
        const parts: string[] = [];
        if (loc.adresseComplete) parts.push(loc.adresseComplete);
        else {
            if (loc.quartierLibelle) parts.push(loc.quartierLibelle);
            if (loc.communeLibelle) parts.push(loc.communeLibelle);
            if (loc.villeLibelle) parts.push(loc.villeLibelle);
        }
        return parts.join(', ') || `Loc. ${loc.localisationUuid?.substring(0, 8)}`;
    }

    // Ajouter ce computed signal après les autres computed
    localisationsOptions = computed(() =>
        this.localisations().map((loc) => ({
            label: this.getLocalisationLabel(loc),
            value: loc.localisationUuid,
            localisation: loc
        }))
    );
}
