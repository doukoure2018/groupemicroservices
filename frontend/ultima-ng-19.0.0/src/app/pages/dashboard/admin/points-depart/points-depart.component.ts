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

// Services
import { DepartService } from '@/service/depart.service';
import { SiteService } from '@/service/site.service';

// Models
import { Depart, DepartRequest } from '@/interface/depart.model';
import { Site } from '@/interface/site.model';

@Component({
    selector: 'app-points-depart',
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
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './points-depart.component.html',
    styleUrl: './points-depart.component.scss'
})
export class PointsDepartComponent implements OnInit {
    // Services
    private readonly departService = inject(DepartService);
    private readonly siteService = inject(SiteService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    departs = signal<Depart[]>([]);
    sites = signal<Site[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    isEditMode = signal(false);
    selectedDepart = signal<Depart | null>(null);
    searchQuery = signal('');
    selectedSiteFilter = signal<string | null>(null);

    // Computed
    filteredDeparts = computed(() => {
        let result = this.departs();

        // Filtre par site
        const siteFilter = this.selectedSiteFilter();
        if (siteFilter) {
            result = result.filter((d) => d.siteUuid === siteFilter);
        }

        // Filtre par recherche
        const query = this.searchQuery().toLowerCase();
        if (query) {
            result = result.filter((depart) => depart.libelle.toLowerCase().includes(query) || depart.siteNom?.toLowerCase().includes(query) || depart.villeLibelle?.toLowerCase().includes(query));
        }

        return result;
    });

    totalDeparts = computed(() => this.departs().length);
    departsActifs = computed(() => this.departs().filter((d) => d.actif).length);

    // Form
    departForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadDeparts();
        this.loadSites();
    }

    private initForm(): void {
        this.departForm = this.fb.group({
            siteUuid: ['', Validators.required],
            libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            description: [''],
            ordreAffichage: [0, [Validators.min(0)]],
            actif: [true]
        });
    }

    loadDeparts(): void {
        this.loading.set(true);
        this.departService.getAll().subscribe({
            next: (data: Depart[]) => {
                this.departs.set(data);
                this.loading.set(false);
            },
            error: (err: any) => {
                console.error('Erreur chargement départs:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les points de départ'
                });
                this.loading.set(false);
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

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedDepart.set(null);
        this.departForm.reset({ ordreAffichage: 0, actif: true });
        this.dialogVisible.set(true);
    }

    openEditDialog(depart: Depart): void {
        this.isEditMode.set(true);
        this.selectedDepart.set(depart);
        this.departForm.patchValue({
            siteUuid: depart.siteUuid,
            libelle: depart.libelle,
            description: depart.description,
            ordreAffichage: depart.ordreAffichage,
            actif: depart.actif
        });
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.departForm.reset();
        this.selectedDepart.set(null);
    }

    saveDepart(): void {
        if (this.departForm.invalid) {
            this.departForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        const request: DepartRequest = this.departForm.value;
        this.loading.set(true);

        if (this.isEditMode() && this.selectedDepart()) {
            this.departService.update(this.selectedDepart()!.departUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Point de départ mis à jour avec succès'
                    });
                    this.loadDeparts();
                    this.closeDialog();
                },
                error: (err: any) => {
                    console.error('Erreur mise à jour:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.message || 'Impossible de mettre à jour le point de départ'
                    });
                    this.loading.set(false);
                }
            });
        } else {
            this.departService.create(request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Point de départ créé avec succès'
                    });
                    this.loadDeparts();
                    this.closeDialog();
                },
                error: (err: any) => {
                    console.error('Erreur création:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.message || 'Impossible de créer le point de départ'
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    toggleActif(depart: Depart): void {
        this.departService.toggleActif(depart.departUuid!).subscribe({
            next: (updated: Depart) => {
                const message = updated.actif ? 'Point de départ activé' : 'Point de départ désactivé';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: message
                });
                this.loadDeparts();
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

    confirmDelete(depart: Depart): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le point de départ "${depart.libelle}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteDepart(depart)
        });
    }

    private deleteDepart(depart: Depart): void {
        this.departService.delete(depart.departUuid!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Point de départ supprimé avec succès'
                });
                this.loadDeparts();
            },
            error: (err: any) => {
                console.error('Erreur suppression:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de supprimer le point de départ'
                });
            }
        });
    }

    getSiteLabel(site: Site): string {
        return `${site.nom} (${site.villeLibelle || 'N/A'})`;
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    onSiteFilterChange(siteUuid: string | null): void {
        this.selectedSiteFilter.set(siteUuid);
    }

    clearFilters(): void {
        this.searchQuery.set('');
        this.selectedSiteFilter.set(null);
    }
}
