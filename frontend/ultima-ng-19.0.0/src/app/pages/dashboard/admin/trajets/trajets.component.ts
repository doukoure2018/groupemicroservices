import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Modules
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';

// Services
import { TrajetService } from '@/service/trajet.service';
import { DepartService } from '@/service/depart.service';
import { ArriveeService } from '@/service/arrivee.service';

// Models - Utiliser vos interfaces existantes
import { Trajet, TrajetRequest, DEVISES, formatDuree, formatDistance, formatMontant } from '@/interface/trajet.model';
import { Depart } from '@/interface/depart.model';
import { Arrivee } from '@/interface/arrivee.model';

@Component({
    selector: 'app-trajets',
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
        ProgressSpinnerModule,
        CardModule,
        BadgeModule,
        IconFieldModule,
        InputIconModule,
        CheckboxModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './trajets.component.html',
    styleUrl: './trajets.component.scss'
})
export class TrajetsComponent implements OnInit {
    // Services
    private readonly trajetService = inject(TrajetService);
    private readonly departService = inject(DepartService);
    private readonly arriveeService = inject(ArriveeService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    trajets = signal<Trajet[]>([]);
    departs = signal<Depart[]>([]);
    arrivees = signal<Arrivee[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    montantsDialogVisible = signal(false);
    isEditMode = signal(false);
    selectedTrajet = signal<Trajet | null>(null);
    searchQuery = signal('');

    // Options
    devises = DEVISES;

    // Computed
    filteredTrajets = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.trajets();
        return this.trajets().filter(
            (trajet) =>
                trajet.libelleTrajet?.toLowerCase().includes(query) ||
                trajet.departVilleLibelle?.toLowerCase().includes(query) ||
                trajet.arriveeVilleLibelle?.toLowerCase().includes(query) ||
                trajet.departSiteNom?.toLowerCase().includes(query) ||
                trajet.arriveeSiteNom?.toLowerCase().includes(query) ||
                trajet.departRegionLibelle?.toLowerCase().includes(query) ||
                trajet.arriveeRegionLibelle?.toLowerCase().includes(query)
        );
    });

    totalTrajets = computed(() => this.trajets().length);
    trajetsActifs = computed(() => this.trajets().filter((t) => t.actif).length);
    trajetsInactifs = computed(() => this.trajets().filter((t) => !t.actif).length);

    // Options transformées pour les dropdowns
    departsOptions = computed(() => {
        return this.departs().map((depart) => ({
            label: this.getDepartLabel(depart),
            value: depart.departUuid,
            depart: depart
        }));
    });

    arriveesOptions = computed(() => {
        return this.arrivees().map((arrivee) => ({
            label: this.getArriveeLabel(arrivee),
            value: arrivee.arriveeUuid,
            arrivee: arrivee
        }));
    });

    // Form
    trajetForm!: FormGroup;
    montantsForm!: FormGroup;

    ngOnInit(): void {
        this.initForms();
        this.loadTrajets();
        this.loadDeparts();
        this.loadArrivees();
    }

    private initForms(): void {
        this.trajetForm = this.fb.group({
            departUuid: ['', Validators.required],
            arriveeUuid: ['', Validators.required],
            libelleTrajet: ['', [Validators.maxLength(200)]],
            description: [''],
            distanceKm: [null, [Validators.min(0), Validators.max(10000)]],
            dureeEstimeeMinutes: [null, [Validators.min(0), Validators.max(10000)]],
            montantBase: [null, [Validators.min(0)]],
            montantBagages: [null, [Validators.min(0)]],
            devise: ['GNF'],
            actif: [true]
        });

        this.montantsForm = this.fb.group({
            montantBase: [null, [Validators.required, Validators.min(0)]],
            montantBagages: [null, [Validators.min(0)]]
        });
    }

    // ========== CHARGEMENT DES DONNÉES ==========

    loadTrajets(): void {
        this.loading.set(true);
        this.trajetService.getAll().subscribe({
            next: (data: Trajet[]) => {
                this.trajets.set(data);
                this.loading.set(false);
            },
            error: (err: any) => {
                console.error('Erreur chargement trajets:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les trajets'
                });
                this.loading.set(false);
            }
        });
    }

    loadDeparts(): void {
        this.departService.getAllActifs().subscribe({
            next: (data: Depart[]) => {
                this.departs.set(data);
            },
            error: (err: any) => {
                console.error('Erreur chargement départs:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les départs'
                });
            }
        });
    }

    loadArrivees(): void {
        this.arriveeService.getAllActifs().subscribe({
            next: (data: Arrivee[]) => {
                this.arrivees.set(data);
            },
            error: (err: any) => {
                console.error('Erreur chargement arrivées:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les arrivées'
                });
            }
        });
    }

    // ========== GESTION DU DIALOG PRINCIPAL ==========

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedTrajet.set(null);
        this.trajetForm.reset({ devise: 'GNF', actif: true });
        this.dialogVisible.set(true);
    }

    openEditDialog(trajet: Trajet): void {
        this.isEditMode.set(true);
        this.selectedTrajet.set(trajet);
        this.trajetForm.patchValue({
            departUuid: trajet.departUuid,
            arriveeUuid: trajet.arriveeUuid,
            libelleTrajet: trajet.libelleTrajet,
            description: trajet.description,
            distanceKm: trajet.distanceKm,
            dureeEstimeeMinutes: trajet.dureeEstimeeMinutes,
            montantBase: trajet.montantBase,
            montantBagages: trajet.montantBagages,
            devise: trajet.devise || 'GNF',
            actif: trajet.actif
        });
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.trajetForm.reset();
        this.selectedTrajet.set(null);
    }

    // ========== GESTION DU DIALOG MONTANTS ==========

    openMontantsDialog(trajet: Trajet): void {
        this.selectedTrajet.set(trajet);
        this.montantsForm.patchValue({
            montantBase: trajet.montantBase,
            montantBagages: trajet.montantBagages
        });
        this.montantsDialogVisible.set(true);
    }

    closeMontantsDialog(): void {
        this.montantsDialogVisible.set(false);
        this.montantsForm.reset();
        this.selectedTrajet.set(null);
    }

    // ========== SAUVEGARDE ==========

    saveTrajet(): void {
        if (this.trajetForm.invalid) {
            this.trajetForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        // Validation: départ et arrivée différents
        const formValue = this.trajetForm.value;
        if (formValue.departUuid === formValue.arriveeUuid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: "Le départ et l'arrivée doivent être différents"
            });
            return;
        }

        const request: TrajetRequest = this.trajetForm.value;
        this.loading.set(true);

        if (this.isEditMode() && this.selectedTrajet()) {
            this.trajetService.update(this.selectedTrajet()!.trajetUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Trajet mis à jour avec succès'
                    });
                    this.loadTrajets();
                    this.closeDialog();
                },
                error: (err: any) => {
                    console.error('Erreur mise à jour:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: typeof err === 'string' ? err : 'Impossible de mettre à jour le trajet'
                    });
                    this.loading.set(false);
                }
            });
        } else {
            this.trajetService.create(request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Trajet créé avec succès'
                    });
                    this.loadTrajets();
                    this.closeDialog();
                },
                error: (err: any) => {
                    console.error('Erreur création:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: typeof err === 'string' ? err : 'Impossible de créer le trajet'
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    saveMontants(): void {
        if (this.montantsForm.invalid || !this.selectedTrajet()) {
            this.montantsForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Le montant de base est obligatoire'
            });
            return;
        }

        const { montantBase, montantBagages } = this.montantsForm.value;
        this.loading.set(true);

        this.trajetService.updateMontants(this.selectedTrajet()!.trajetUuid!, montantBase, montantBagages).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Montants mis à jour avec succès'
                });
                this.loadTrajets();
                this.closeMontantsDialog();
            },
            error: (err: any) => {
                console.error('Erreur mise à jour montants:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: typeof err === 'string' ? err : 'Impossible de mettre à jour les montants'
                });
                this.loading.set(false);
            }
        });
    }

    // ========== ACTIONS ==========

    toggleActif(trajet: Trajet): void {
        this.trajetService.toggleActif(trajet.trajetUuid!).subscribe({
            next: (updated: Trajet) => {
                const message = updated.actif ? 'Trajet activé' : 'Trajet désactivé';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: message
                });
                this.loadTrajets();
            },
            error: (err: any) => {
                console.error('Erreur toggle actif:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: typeof err === 'string' ? err : 'Impossible de modifier le statut'
                });
            }
        });
    }

    confirmDelete(trajet: Trajet): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le trajet "${trajet.libelleTrajet || trajet.departVilleLibelle + ' → ' + trajet.arriveeVilleLibelle}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteTrajet(trajet)
        });
    }

    private deleteTrajet(trajet: Trajet): void {
        this.trajetService.delete(trajet.trajetUuid!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Trajet supprimé avec succès'
                });
                this.loadTrajets();
            },
            error: (err: any) => {
                console.error('Erreur suppression:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: typeof err === 'string' ? err : 'Impossible de supprimer le trajet'
                });
            }
        });
    }

    // ========== UTILITAIRES ==========

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    getDepartLabel(depart: Depart): string {
        const parts: string[] = [];
        if (depart.libelle) parts.push(depart.libelle);
        if (depart.siteNom) parts.push(`(${depart.siteNom})`);
        if (depart.villeLibelle) parts.push(`- ${depart.villeLibelle}`);
        return parts.join(' ') || `Départ ${depart.departUuid?.substring(0, 8)}`;
    }

    getArriveeLabel(arrivee: Arrivee): string {
        const parts: string[] = [];
        if (arrivee.libelle) parts.push(arrivee.libelle);
        if (arrivee.siteNom) parts.push(`(${arrivee.siteNom})`);
        if (arrivee.villeLibelle) parts.push(`- ${arrivee.villeLibelle}`);
        return parts.join(' ') || `Arrivée ${arrivee.arriveeUuid?.substring(0, 8)}`;
    }

    getTrajetLibelle(trajet: Trajet): string {
        if (trajet.libelleTrajet) return trajet.libelleTrajet;
        return `${trajet.departVilleLibelle || 'N/A'} → ${trajet.arriveeVilleLibelle || 'N/A'}`;
    }

    // Formatage
    formatDuree = formatDuree;
    formatDistance = formatDistance;
    formatMontant = formatMontant;

    getStatutSeverity(actif: boolean | undefined): 'success' | 'danger' {
        return actif ? 'success' : 'danger';
    }

    getStatutLabel(actif: boolean | undefined): string {
        return actif ? 'Actif' : 'Inactif';
    }
}
