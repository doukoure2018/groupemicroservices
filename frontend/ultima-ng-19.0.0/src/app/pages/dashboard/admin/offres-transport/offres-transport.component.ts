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
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { ProgressBarModule } from 'primeng/progressbar';

// Services & Models
import { OffreService } from '@/service/offre.service';
import { TrajetService } from '@/service/trajet.service';
import { VehiculeService } from '@/service/vehicule.service';
import {
    Offre,
    OffreRequest,
    OffreStats,
    STATUTS_OFFRE,
    DEVISES_OFFRE,
    getStatutOffreSeverity,
    getStatutOffreLabel,
    formatMontantOffre,
    formatDateOffre,
    formatHeureOffre,
    hasPromotion,
    getPourcentageReduction,
    getTauxRemplissage,
    getRemplissageSeverity
} from '@/interface/offre.model';
import { Trajet } from '@/interface/trajet.model';
import { Vehicule } from '@/interface/vehicule.model';

@Component({
    selector: 'app-offres-transport',
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
        CalendarModule,
        CheckboxModule,
        MenuModule,
        ProgressBarModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './offres-transport.component.html',
    styleUrl: './offres-transport.component.scss'
})
export class OffresTransportComponent implements OnInit {
    private readonly offreService = inject(OffreService);
    private readonly trajetService = inject(TrajetService);
    private readonly vehiculeService = inject(VehiculeService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    offres = signal<Offre[]>([]);
    trajets = signal<Trajet[]>([]);
    vehicules = signal<Vehicule[]>([]);
    stats = signal<OffreStats | null>(null);
    loading = signal(false);
    dialogVisible = signal(false);
    promotionDialogVisible = signal(false);
    detailDialogVisible = signal(false);
    isEditMode = signal(false);
    selectedOffre = signal<Offre | null>(null);
    searchQuery = signal('');
    filterStatut = signal<string | null>(null);

    // Options
    statutsOffre = STATUTS_OFFRE;
    devisesOffre = DEVISES_OFFRE;
    today = new Date();

    // Computed
    filteredOffres = computed(() => {
        let result = this.offres();
        const query = this.searchQuery().toLowerCase();
        const statut = this.filterStatut();

        if (query) {
            result = result.filter(
                (o) =>
                    o.villeDepartLibelle?.toLowerCase().includes(query) ||
                    o.villeArriveeLibelle?.toLowerCase().includes(query) ||
                    o.trajetLibelle?.toLowerCase().includes(query) ||
                    o.vehiculeImmatriculation?.toLowerCase().includes(query) ||
                    o.nomChauffeur?.toLowerCase().includes(query)
            );
        }

        if (statut) {
            result = result.filter((o) => o.statut === statut);
        }

        return result;
    });

    totalOffres = computed(() => this.offres().length);
    offresOuvertes = computed(() => this.offres().filter((o) => o.statut === 'OUVERT').length);
    offresEnCours = computed(() => this.offres().filter((o) => o.statut === 'EN_COURS').length);
    offresAujourdHui = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this.offres().filter((o) => o.dateDepart === today).length;
    });

    trajetsOptions = computed(() =>
        this.trajets()
            .filter((t) => t.actif)
            .map((t) => ({
                label: t.libelleTrajet || `${t.departVilleLibelle} → ${t.arriveeVilleLibelle}`,
                value: t.trajetUuid
            }))
    );

    vehiculesOptions = computed(() =>
        this.vehicules()
            .filter((v) => v.statut === 'ACTIF')
            .map((v) => ({
                label: `${v.immatriculation} - ${v.marque} ${v.modele} (${v.nombrePlaces} places)`,
                value: v.vehiculeUuid
            }))
    );

    // Selected trajet and vehicule for form info display
    selectedTrajetUuid = signal<string | null>(null);
    selectedVehiculeUuid = signal<string | null>(null);

    selectedTrajetInfo = computed(() => {
        const uuid = this.selectedTrajetUuid();
        if (!uuid) return null;
        return this.trajets().find((t) => t.trajetUuid === uuid) || null;
    });

    selectedVehiculeInfo = computed(() => {
        const uuid = this.selectedVehiculeUuid();
        if (!uuid) return null;
        return this.vehicules().find((v) => v.vehiculeUuid === uuid) || null;
    });

    // Forms
    offreForm!: FormGroup;
    promotionForm!: FormGroup;

    // Helper functions
    getStatutSeverity = getStatutOffreSeverity;
    getStatutLabel = getStatutOffreLabel;
    formatMontant = formatMontantOffre;
    formatDate = formatDateOffre;
    formatHeure = formatHeureOffre;
    hasPromo = hasPromotion;
    getReduction = getPourcentageReduction;
    getTaux = getTauxRemplissage;
    getTauxSeverity = getRemplissageSeverity;

    ngOnInit(): void {
        this.initForms();
        this.loadOffres();
        this.loadTrajets();
        this.loadVehicules();
        this.loadStats();
    }

    private initForms(): void {
        this.offreForm = this.fb.group({
            trajetUuid: ['', Validators.required],
            vehiculeUuid: ['', Validators.required],
            dateDepart: [null, Validators.required],
            heureDepart: [null, Validators.required],
            heureArriveeEstimee: [null],
            nombrePlacesTotal: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
            montant: [0, [Validators.required, Validators.min(1)]],
            montantPromotion: [null],
            devise: ['GNF'],
            pointRendezvous: [''],
            conditions: [''],
            annulationAutorisee: [true],
            delaiAnnulationHeures: [24, [Validators.min(0)]]
        });

        this.promotionForm = this.fb.group({
            montantPromotion: [0, [Validators.required, Validators.min(1)]]
        });
    }

    loadOffres(): void {
        this.loading.set(true);
        this.offreService.getAll().subscribe({
            next: (data) => {
                this.offres.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    loadTrajets(): void {
        this.trajetService.getAllActifs().subscribe({
            next: (data) => this.trajets.set(data),
            error: (err) => console.error('Erreur chargement trajets:', err)
        });
    }

    loadVehicules(): void {
        this.vehiculeService.getAll().subscribe({
            next: (data) => this.vehicules.set(data),
            error: (err) => console.error('Erreur chargement véhicules:', err)
        });
    }

    loadStats(): void {
        this.offreService.getStats().subscribe({
            next: (data) => this.stats.set(data),
            error: (err) => console.error('Erreur chargement stats:', err)
        });
    }

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedOffre.set(null);
        this.selectedTrajetUuid.set(null);
        this.selectedVehiculeUuid.set(null);
        this.offreForm.reset({
            devise: 'GNF',
            nombrePlacesTotal: 1,
            montant: 0,
            annulationAutorisee: true,
            delaiAnnulationHeures: 24
        });
        this.dialogVisible.set(true);
    }

    openEditDialog(offre: Offre): void {
        this.isEditMode.set(true);
        this.selectedOffre.set(offre);
        this.selectedTrajetUuid.set(offre.trajetUuid || null);
        this.selectedVehiculeUuid.set(offre.vehiculeUuid || null);
        this.offreForm.patchValue({
            trajetUuid: offre.trajetUuid,
            vehiculeUuid: offre.vehiculeUuid,
            dateDepart: offre.dateDepart ? new Date(offre.dateDepart) : null,
            heureDepart: offre.heureDepart ? this.parseTime(offre.heureDepart) : null,
            heureArriveeEstimee: offre.heureArriveeEstimee ? this.parseTime(offre.heureArriveeEstimee) : null,
            nombrePlacesTotal: offre.nombrePlacesTotal,
            montant: offre.montant,
            montantPromotion: offre.montantPromotion,
            devise: offre.devise || 'GNF',
            pointRendezvous: offre.pointRendezvous,
            conditions: offre.conditions,
            annulationAutorisee: offre.annulationAutorisee,
            delaiAnnulationHeures: offre.delaiAnnulationHeures
        });
        this.dialogVisible.set(true);
    }

    openDetailDialog(offre: Offre): void {
        this.selectedOffre.set(offre);
        this.detailDialogVisible.set(true);
    }

    openPromotionDialog(offre: Offre): void {
        this.selectedOffre.set(offre);
        this.promotionForm.patchValue({
            montantPromotion: offre.montantPromotion || Math.round((offre.montant || 0) * 0.9)
        });
        this.promotionDialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.selectedTrajetUuid.set(null);
        this.selectedVehiculeUuid.set(null);
        this.offreForm.reset();
    }

    closePromotionDialog(): void {
        this.promotionDialogVisible.set(false);
        this.promotionForm.reset();
    }

    closeDetailDialog(): void {
        this.detailDialogVisible.set(false);
    }

    saveOffre(): void {
        if (this.offreForm.invalid) {
            this.offreForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir les champs obligatoires' });
            return;
        }

        const formValue = this.offreForm.value;
        const request: OffreRequest = {
            trajetUuid: formValue.trajetUuid,
            vehiculeUuid: formValue.vehiculeUuid,
            dateDepart: this.formatDateForApi(formValue.dateDepart),
            heureDepart: this.formatTimeForApi(formValue.heureDepart),
            heureArriveeEstimee: formValue.heureArriveeEstimee ? this.formatTimeForApi(formValue.heureArriveeEstimee) : undefined,
            nombrePlacesTotal: formValue.nombrePlacesTotal,
            montant: formValue.montant,
            montantPromotion: formValue.montantPromotion || undefined,
            devise: formValue.devise,
            pointRendezvous: formValue.pointRendezvous || undefined,
            conditions: formValue.conditions || undefined,
            annulationAutorisee: formValue.annulationAutorisee,
            delaiAnnulationHeures: formValue.delaiAnnulationHeures || undefined
        };

        this.loading.set(true);

        if (this.isEditMode() && this.selectedOffre()) {
            this.offreService.update(this.selectedOffre()!.offreUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre mise à jour' });
                    this.loadOffres();
                    this.loadStats();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        } else {
            this.offreService.create(request).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre créée' });
                    this.loadOffres();
                    this.loadStats();
                    this.closeDialog();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                    this.loading.set(false);
                }
            });
        }
    }

    savePromotion(): void {
        if (!this.selectedOffre() || this.promotionForm.invalid) return;

        const { montantPromotion } = this.promotionForm.value;
        this.loading.set(true);

        this.offreService.appliquerPromotion(this.selectedOffre()!.offreUuid!, montantPromotion).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Promotion appliquée' });
                this.loadOffres();
                this.closePromotionDialog();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err });
                this.loading.set(false);
            }
        });
    }

    retirerPromotion(offre: Offre): void {
        this.confirmationService.confirm({
            message: 'Retirer la promotion de cette offre ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.offreService.retirerPromotion(offre.offreUuid!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Promotion retirée' });
                        this.loadOffres();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
                });
            }
        });
    }

    // Status actions
    ouvrirOffre(offre: Offre): void {
        this.offreService.ouvrir(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre ouverte' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    fermerOffre(offre: Offre): void {
        this.offreService.fermer(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre fermée' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    cloturerOffre(offre: Offre): void {
        this.confirmationService.confirm({
            message: 'Clôturer définitivement cette offre ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.offreService.cloturer(offre.offreUuid!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre clôturée' });
                        this.loadOffres();
                        this.loadStats();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
                });
            }
        });
    }

    annulerOffre(offre: Offre): void {
        this.confirmationService.confirm({
            message: 'Annuler cette offre ? Cette action est irréversible.',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, annuler',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.offreService.annuler(offre.offreUuid!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre annulée' });
                        this.loadOffres();
                        this.loadStats();
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
                });
            }
        });
    }

    demarrerOffre(offre: Offre): void {
        this.offreService.demarrer(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Voyage démarré' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    terminerOffre(offre: Offre): void {
        this.offreService.terminer(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Voyage terminé' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    suspendreOffre(offre: Offre): void {
        this.offreService.suspendre(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Offre suspendue' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    reprendreOffre(offre: Offre): void {
        this.offreService.reprendre(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre reprise' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    confirmDelete(offre: Offre): void {
        this.confirmationService.confirm({
            message: `Supprimer l'offre ${offre.villeDepartLibelle} → ${offre.villeArriveeLibelle} du ${this.formatDate(offre.dateDepart)} ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteOffre(offre)
        });
    }

    private deleteOffre(offre: Offre): void {
        this.offreService.delete(offre.offreUuid!).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Offre supprimée' });
                this.loadOffres();
                this.loadStats();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err })
        });
    }

    onSearch(event: Event): void {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    onFilterStatut(statut: string | null): void {
        this.filterStatut.set(statut);
    }

    onTrajetChange(event: { value: string }): void {
        this.selectedTrajetUuid.set(event.value);
        const trajet = this.trajets().find((t) => t.trajetUuid === event.value);
        if (trajet?.montantBase) {
            this.offreForm.patchValue({ montant: trajet.montantBase });
        }
    }

    onVehiculeChange(event: { value: string }): void {
        this.selectedVehiculeUuid.set(event.value);
        const vehicule = this.vehicules().find((v) => v.vehiculeUuid === event.value);
        if (vehicule?.nombrePlaces) {
            this.offreForm.patchValue({ nombrePlacesTotal: vehicule.nombrePlaces });
        }
    }

    // Utility methods
    private formatDateForApi(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private formatTimeForApi(date: Date): string {
        return date.toTimeString().substring(0, 5);
    }

    private parseTime(time: string | number[] | undefined): Date | null {
        if (!time) return null;

        const date = new Date();

        // Si c'est un tableau [heure, minute, seconde]
        if (Array.isArray(time)) {
            date.setHours(time[0] || 0, time[1] || 0, 0, 0);
            return date;
        }

        // Si c'est une chaîne "HH:mm" ou "HH:mm:ss"
        if (typeof time === 'string') {
            const [hours, minutes] = time.split(':').map(Number);
            date.setHours(hours || 0, minutes || 0, 0, 0);
            return date;
        }

        return null;
    }

    canOuvrir(offre: Offre): boolean {
        return offre.statut === 'EN_ATTENTE' || offre.statut === 'FERME';
    }

    canFermer(offre: Offre): boolean {
        return offre.statut === 'OUVERT';
    }

    canDemarrer(offre: Offre): boolean {
        return offre.statut === 'OUVERT' || offre.statut === 'FERME';
    }

    canTerminer(offre: Offre): boolean {
        return offre.statut === 'EN_COURS';
    }

    canSuspendre(offre: Offre): boolean {
        return offre.statut === 'OUVERT' || offre.statut === 'EN_ATTENTE';
    }

    canReprendre(offre: Offre): boolean {
        return offre.statut === 'SUSPENDU';
    }

    canAnnuler(offre: Offre): boolean {
        return offre.statut !== 'ANNULE' && offre.statut !== 'TERMINE' && offre.statut !== 'EN_COURS';
    }

    canEdit(offre: Offre): boolean {
        return offre.statut === 'EN_ATTENTE' || offre.statut === 'OUVERT';
    }

    canDelete(offre: Offre): boolean {
        return offre.statut === 'EN_ATTENTE' || offre.statut === 'ANNULE';
    }

    // Menu d'actions dynamique
    getActionsMenu(offre: Offre): MenuItem[] {
        const items: MenuItem[] = [];

        // Actions de statut
        if (this.canOuvrir(offre)) {
            items.push({
                label: 'Ouvrir',
                icon: 'pi pi-lock-open',
                command: () => this.ouvrirOffre(offre)
            });
        }

        if (this.canFermer(offre)) {
            items.push({
                label: 'Fermer',
                icon: 'pi pi-lock',
                command: () => this.fermerOffre(offre)
            });
        }

        if (this.canDemarrer(offre)) {
            items.push({
                label: 'Démarrer le voyage',
                icon: 'pi pi-play',
                command: () => this.demarrerOffre(offre)
            });
        }

        if (this.canTerminer(offre)) {
            items.push({
                label: 'Terminer le voyage',
                icon: 'pi pi-stop',
                command: () => this.terminerOffre(offre)
            });
        }

        if (this.canSuspendre(offre)) {
            items.push({
                label: 'Suspendre',
                icon: 'pi pi-pause',
                command: () => this.suspendreOffre(offre)
            });
        }

        if (this.canReprendre(offre)) {
            items.push({
                label: 'Reprendre',
                icon: 'pi pi-play',
                command: () => this.reprendreOffre(offre)
            });
        }

        // Séparateur si on a des actions de statut
        if (items.length > 0) {
            items.push({ separator: true });
        }

        // Promotion
        items.push({
            label: this.hasPromo(offre) ? 'Modifier la promotion' : 'Ajouter une promotion',
            icon: 'pi pi-percentage',
            command: () => this.openPromotionDialog(offre)
        });

        // Actions dangereuses
        if (this.canAnnuler(offre) || this.canDelete(offre)) {
            items.push({ separator: true });

            if (this.canAnnuler(offre)) {
                items.push({
                    label: 'Annuler l\'offre',
                    icon: 'pi pi-times',
                    styleClass: 'text-red-500',
                    command: () => this.annulerOffre(offre)
                });
            }

            if (this.canDelete(offre)) {
                items.push({
                    label: 'Supprimer',
                    icon: 'pi pi-trash',
                    styleClass: 'text-red-500',
                    command: () => this.confirmDelete(offre)
                });
            }
        }

        return items;
    }
}
