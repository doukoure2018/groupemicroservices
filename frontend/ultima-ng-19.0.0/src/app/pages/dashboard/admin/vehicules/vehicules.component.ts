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
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { CalendarModule } from 'primeng/calendar';
import { MenuModule } from 'primeng/menu';

// Services & Models
import { VehiculeService } from '@/service/vehicule.service';
import { TypeVehiculeService } from '@/service/type-vehicule.service';
import { Vehicule, VehiculeRequest, STATUTS_VEHICULE, COULEURS_VEHICULE, getStatutVehiculeSeverity, getStatutVehiculeLabel } from '@/interface/vehicule.model';
import { TypeVehicule } from '@/interface/type-vehicule.model';

@Component({
    selector: 'app-vehicules',
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
        CheckboxModule,
        DividerModule,
        CalendarModule,
        MenuModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './vehicules.component.html',
    styleUrl: './vehicules.component.scss'
})
export class VehiculesComponent implements OnInit {
    private readonly vehiculeService = inject(VehiculeService);
    private readonly typeVehiculeService = inject(TypeVehiculeService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    PHONE_PATTERN = /^(00224|\+224)?[0-9]{9}$/;

    // Signals
    vehicules = signal<Vehicule[]>([]);
    typesVehicules = signal<TypeVehicule[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    isEditMode = signal(false);
    selectedVehicule = signal<Vehicule | null>(null);
    searchQuery = signal('');

    // Options
    statutsVehicule = STATUTS_VEHICULE;
    couleursVehicule = COULEURS_VEHICULE;

    // Computed
    filteredVehicules = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.vehicules();
        return this.vehicules().filter(
            (v) =>
                v.immatriculation?.toLowerCase().includes(query) ||
                v.marque?.toLowerCase().includes(query) ||
                v.modele?.toLowerCase().includes(query) ||
                v.nomChauffeur?.toLowerCase().includes(query) ||
                v.typeVehiculeLibelle?.toLowerCase().includes(query)
        );
    });

    totalVehicules = computed(() => this.vehicules().length);
    vehiculesActifs = computed(() => this.vehicules().filter((v) => v.statut === 'ACTIF').length);
    vehiculesEnMaintenance = computed(() => this.vehicules().filter((v) => v.statut === 'EN_MAINTENANCE').length);

    // Options transformées pour dropdown
    typesOptions = computed(() =>
        this.typesVehicules().map((t) => ({
            label: `${t.libelle} (${t.capaciteMin || '?'}-${t.capaciteMax || '?'} places)`,
            value: t.typeVehiculeUuid
        }))
    );

    // Form
    vehiculeForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadVehicules();
        this.loadTypesVehicules();
    }

    private initForm(): void {
        this.vehiculeForm = this.fb.group({
            typeVehiculeUuid: [''],
            immatriculation: ['', [Validators.required, Validators.maxLength(20)]],
            marque: ['', Validators.maxLength(50)],
            modele: ['', Validators.maxLength(50)],
            anneeFabrication: [null, [Validators.min(1990), Validators.max(new Date().getFullYear() + 1)]],
            nombrePlaces: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
            nomChauffeur: ['', [Validators.required, Validators.maxLength(100)]],
            contactChauffeur: ['', [Validators.required, Validators.pattern(this.PHONE_PATTERN)]],
            contactProprietaire: ['', [Validators.pattern(this.PHONE_PATTERN)]],
            description: [''],
            couleur: [''],
            climatise: [false],
            imageUrl: [''],
            documentAssuranceUrl: [''],
            dateExpirationAssurance: [''],
            documentVisiteTechniqueUrl: [''],
            dateExpirationVisite: ['']
        });
    }

    // Ajouter cette méthode pour formater le numéro
    formatPhoneNumber(value: string): string {
        if (!value) return '';
        // Supprimer tout sauf les chiffres et le +
        let cleaned = value.replace(/[^\d+]/g, '');
        // Ajouter le préfixe si absent
        if (!cleaned.startsWith('00224') && !cleaned.startsWith('+224')) {
            if (cleaned.startsWith('6') || cleaned.startsWith('2') || cleaned.startsWith('3')) {
                cleaned = '00224' + cleaned;
            }
        }
        return cleaned;
    }

    loadVehicules(): void {
        this.loading.set(true);
        this.vehiculeService.getAll().subscribe({
            next: (data) => {
                this.vehicules.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    loadTypesVehicules(): void {
        this.typeVehiculeService.getAllActifs().subscribe({
            next: (data) => this.typesVehicules.set(data),
            error: (err) => console.error('Erreur chargement types:', err)
        });
    }

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedVehicule.set(null);
        this.vehiculeForm.reset({ climatise: false });
        this.dialogVisible.set(true);
    }

    openEditDialog(vehicule: Vehicule): void {
        this.isEditMode.set(true);
        this.selectedVehicule.set(vehicule);
        this.vehiculeForm.patchValue({
            typeVehiculeUuid: vehicule.typeVehiculeUuid,
            immatriculation: vehicule.immatriculation,
            marque: vehicule.marque,
            modele: vehicule.modele,
            anneeFabrication: vehicule.anneeFabrication,
            nombrePlaces: vehicule.nombrePlaces,
            nomChauffeur: vehicule.nomChauffeur,
            contactChauffeur: vehicule.contactChauffeur,
            contactProprietaire: vehicule.contactProprietaire,
            description: vehicule.description,
            couleur: vehicule.couleur,
            climatise: vehicule.climatise,
            imageUrl: vehicule.imageUrl,
            documentAssuranceUrl: vehicule.documentAssuranceUrl,
            dateExpirationAssurance: vehicule.dateExpirationAssurance || '',
            dateExpirationVisite: vehicule.dateExpirationVisite || '',
            documentVisiteTechniqueUrl: vehicule.documentVisiteTechniqueUrl
        });
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.vehiculeForm.reset();
    }

    saveVehicule(): void {
        if (this.vehiculeForm.invalid) {
            this.vehiculeForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir les champs obligatoires' });
            return;
        }

        const formValue = this.vehiculeForm.value;
        const request: VehiculeRequest = {
            ...formValue,
            dateExpirationAssurance: formValue.dateExpirationAssurance || null,
            dateExpirationVisite: formValue.dateExpirationVisite || null,
            contactChauffeur: this.formatPhoneNumber(formValue.contactChauffeur),
            contactProprietaire: formValue.contactProprietaire ? this.formatPhoneNumber(formValue.contactProprietaire) : null
        };

        this.loading.set(true);

        if (this.isEditMode() && this.selectedVehicule()) {
            this.vehiculeService.update(this.selectedVehicule()!.vehiculeUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Véhicule mis à jour' });
                    this.loadVehicules();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        } else {
            this.vehiculeService.create(request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Véhicule créé' });
                    this.loadVehicules();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        }
    }

    changeStatut(vehicule: Vehicule, statut: string): void {
        this.vehiculeService.updateStatut(vehicule.vehiculeUuid!, statut).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Statut mis à jour' });
                this.loadVehicules();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    confirmDelete(vehicule: Vehicule): void {
        this.confirmationService.confirm({
            message: `Supprimer le véhicule "${vehicule.immatriculation}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteVehicule(vehicule)
        });
    }

    private deleteVehicule(vehicule: Vehicule): void {
        this.vehiculeService.delete(vehicule.vehiculeUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Véhicule supprimé' });
                this.loadVehicules();
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

    getStatutSeverity = getStatutVehiculeSeverity;
    getStatutLabel = getStatutVehiculeLabel;

    getVehiculeDescription(v: Vehicule): string {
        const parts: string[] = [];
        if (v.marque) parts.push(v.marque);
        if (v.modele) parts.push(v.modele);
        if (v.anneeFabrication) parts.push(`(${v.anneeFabrication})`);
        return parts.join(' ') || '-';
    }
}
