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
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';

// Services
import { ArriveeService } from '@/service/arrivee.service';
import { DepartService } from '@/service/depart.service';
import { SiteService } from '@/service/site.service';

// Models
import { Arrivee, ArriveeRequest } from '@/interface/arrivee.model';
import { Depart } from '@/interface/depart.model';
import { Site } from '@/interface/site.model';

@Component({
    selector: 'app-points-arrivee',
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
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './points-arrivee.component.html',
    styleUrl: './points-arrivee.component.scss'
})
export class PointsArriveeComponent implements OnInit {
    // Services
    private readonly arriveeService = inject(ArriveeService);
    private readonly departService = inject(DepartService);
    private readonly siteService = inject(SiteService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    arrivees = signal<Arrivee[]>([]);
    departs = signal<Depart[]>([]);
    sites = signal<Site[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    isEditMode = signal(false);
    selectedArrivee = signal<Arrivee | null>(null);
    searchQuery = signal('');
    selectedDepartFilter = signal<string | null>(null);
    selectedSiteFilter = signal<string | null>(null);

    // Computed
    filteredArrivees = computed(() => {
        let result = this.arrivees();

        // Filtre par site d'arrivée
        const siteFilter = this.selectedSiteFilter();
        if (siteFilter) {
            result = result.filter((a) => a.siteUuid === siteFilter);
        }

        // Filtre par départ
        const departFilter = this.selectedDepartFilter();
        if (departFilter) {
            result = result.filter((a) => a.departUuid === departFilter);
        }

        // Filtre par recherche
        const query = this.searchQuery().toLowerCase();
        if (query) {
            result = result.filter(
                (arrivee) =>
                    arrivee.libelle.toLowerCase().includes(query) ||
                    arrivee.siteNom?.toLowerCase().includes(query) ||
                    arrivee.villeLibelle?.toLowerCase().includes(query) ||
                    arrivee.departSiteNom?.toLowerCase().includes(query) ||
                    arrivee.departVilleLibelle?.toLowerCase().includes(query)
            );
        }

        return result;
    });

    totalArrivees = computed(() => this.arrivees().length);
    arriveesActifs = computed(() => this.arrivees().filter((a) => a.actif).length);

    // Form
    arriveeForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadArrivees();
        this.loadDeparts();
        this.loadSites();
    }

    private initForm(): void {
        this.arriveeForm = this.fb.group({
            departUuid: ['', Validators.required],
            siteUuid: ['', Validators.required],
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            libelleDepart: ['', [Validators.maxLength(100)]],
            description: [''],
            ordreAffichage: [0, [Validators.min(0)]],
            actif: [true]
        });

        // Auto-remplir libelleDepart quand un départ est sélectionné
        this.arriveeForm.get('departUuid')?.valueChanges.subscribe((uuid: string) => {
            if (uuid && !this.isEditMode()) {
                const depart = this.departs().find((d) => d.departUuid === uuid);
                if (depart) {
                    this.arriveeForm.patchValue({ libelleDepart: depart.libelle });
                }
            }
        });
    }

    loadArrivees(): void {
        this.loading.set(true);
        this.arriveeService.getAll().subscribe({
            next: (data: Arrivee[]) => {
                this.arrivees.set(data);
                this.loading.set(false);
            },
            error: (err: any) => {
                console.error('Erreur chargement arrivées:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: "Impossible de charger les points d'arrivée"
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
            }
        });
    }

    loadSites(): void {
        this.siteService.getAllActifs().subscribe({
            next: (data: Site[]) => {
                this.sites.set(data);
            },
            error: (err: any) => {
                console.error('Erreur chargement sites:', err);
            }
        });
    }

    // Filtre les sites pour exclure le site du départ sélectionné
    getAvailableSitesForArrivee(): Site[] {
        const departUuid = this.arriveeForm.get('departUuid')?.value;
        if (!departUuid) return this.sites();

        const depart = this.departs().find((d) => d.departUuid === departUuid);
        if (!depart) return this.sites();

        // Exclure le site du départ
        return this.sites().filter((s) => s.siteUuid !== depart.siteUuid);
    }

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedArrivee.set(null);
        this.arriveeForm.reset({ ordreAffichage: 0, actif: true });
        this.dialogVisible.set(true);
    }

    openEditDialog(arrivee: Arrivee): void {
        this.isEditMode.set(true);
        this.selectedArrivee.set(arrivee);
        this.arriveeForm.patchValue({
            departUuid: arrivee.departUuid,
            siteUuid: arrivee.siteUuid,
            libelle: arrivee.libelle,
            libelleDepart: arrivee.libelleDepart,
            description: arrivee.description,
            ordreAffichage: arrivee.ordreAffichage,
            actif: arrivee.actif
        });
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.arriveeForm.reset();
        this.selectedArrivee.set(null);
    }

    saveArrivee(): void {
        if (this.arriveeForm.invalid) {
            this.arriveeForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        // Vérifier que le site d'arrivée est différent du site de départ
        const departUuid = this.arriveeForm.get('departUuid')?.value;
        const siteUuid = this.arriveeForm.get('siteUuid')?.value;
        const depart = this.departs().find((d) => d.departUuid === departUuid);

        if (depart && depart.siteUuid === siteUuid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: "Le site d'arrivée doit être différent du site de départ"
            });
            return;
        }

        const request: ArriveeRequest = this.arriveeForm.value;
        this.loading.set(true);

        if (this.isEditMode() && this.selectedArrivee()) {
            this.arriveeService.update(this.selectedArrivee()!.arriveeUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: "Point d'arrivée mis à jour avec succès"
                    });
                    this.loadArrivees();
                    this.closeDialog();
                },
                error: (err: any) => {
                    console.error('Erreur mise à jour:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.message || "Impossible de mettre à jour le point d'arrivée"
                    });
                    this.loading.set(false);
                }
            });
        } else {
            this.arriveeService.create(request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: "Point d'arrivée créé avec succès"
                    });
                    this.loadArrivees();
                    this.closeDialog();
                },
                error: (err: any) => {
                    console.error('Erreur création:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.message || "Impossible de créer le point d'arrivée"
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    toggleActif(arrivee: Arrivee): void {
        this.arriveeService.toggleActif(arrivee.arriveeUuid!).subscribe({
            next: (updated: Arrivee) => {
                const message = updated.actif ? "Point d'arrivée activé" : "Point d'arrivée désactivé";
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: message
                });
                this.loadArrivees();
            },
            error: (err: any) => {
                console.error('Erreur toggle actif:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de modifier le statut'
                });
            }
        });
    }

    confirmDelete(arrivee: Arrivee): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le point d'arrivée "${arrivee.libelle}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteArrivee(arrivee)
        });
    }

    private deleteArrivee(arrivee: Arrivee): void {
        this.arriveeService.delete(arrivee.arriveeUuid!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: "Point d'arrivée supprimé avec succès"
                });
                this.loadArrivees();
            },
            error: (err: any) => {
                console.error('Erreur suppression:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || "Impossible de supprimer le point d'arrivée"
                });
            }
        });
    }

    getDepartLabel(depart: Depart): string {
        return `${depart.libelle} - ${depart.siteNom} (${depart.villeLibelle || 'N/A'})`;
    }

    getSiteLabel(site: Site): string {
        return `${site.nom} (${site.villeLibelle || 'N/A'})`;
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    onDepartFilterChange(departUuid: string | null): void {
        this.selectedDepartFilter.set(departUuid);
    }

    onSiteFilterChange(siteUuid: string | null): void {
        this.selectedSiteFilter.set(siteUuid);
    }

    clearFilters(): void {
        this.searchQuery.set('');
        this.selectedDepartFilter.set(null);
        this.selectedSiteFilter.set(null);
    }

    hasActiveFilters(): boolean {
        return !!(this.searchQuery() || this.selectedDepartFilter() || this.selectedSiteFilter());
    }
}
