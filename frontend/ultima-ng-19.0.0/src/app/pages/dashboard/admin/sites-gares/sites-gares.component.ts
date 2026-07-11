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
import { SiteService } from '@/service/site.service';
import { LocalisationService } from '@/service/localisation.service';
import { VilleService } from '@/service/ville.service';

// Models
import { Site, SiteRequest, TYPE_SITES } from '@/interface/site.model';
import { ILocalisation } from '@/interface/localisation';
import { IVille } from '@/interface/ville';
import { IResponse } from '@/interface/response';

@Component({
    selector: 'app-sites-gares',
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
    templateUrl: './sites-gares.component.html',
    styleUrl: './sites-gares.component.scss'
})
export class SitesGaresComponent implements OnInit {
    // Services
    private readonly siteService = inject(SiteService);
    private readonly localisationService = inject(LocalisationService);
    private readonly villeService = inject(VilleService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);

    // Signals
    sites = signal<Site[]>([]);
    localisations = signal<ILocalisation[]>([]);
    villes = signal<IVille[]>([]);
    loading = signal(false);
    dialogVisible = signal(false);
    isEditMode = signal(false);
    selectedSite = signal<Site | null>(null);
    searchQuery = signal('');

    // Options
    typeSites = TYPE_SITES;

    // Computed
    filteredSites = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.sites();
        return this.sites().filter((site) => site.nom.toLowerCase().includes(query) || site.villeLibelle?.toLowerCase().includes(query) || site.typeSite?.toLowerCase().includes(query) || site.adresseComplete?.toLowerCase().includes(query));
    });

    totalSites = computed(() => this.sites().length);
    sitesActifs = computed(() => this.sites().filter((s) => s.actif).length);

    // Form
    siteForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadSites();
        this.loadLocalisations();
        this.loadVilles();
    }

    private initForm(): void {
        this.siteForm = this.fb.group({
            localisationUuid: ['', Validators.required],
            // V35 : la ville du site est saisie directement (ne dépend plus du
            // quartier de la localisation)
            villeUuid: ['', Validators.required],
            nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            description: [''],
            typeSite: ['GARE_ROUTIERE'],
            capaciteVehicules: [null, [Validators.min(0)]],
            telephone: ['', [Validators.maxLength(20)]],
            email: ['', [Validators.email, Validators.maxLength(100)]],
            horaireOuverture: [''],
            horaireFermeture: [''],
            imageUrl: ['', [Validators.maxLength(255)]],
            actif: [true]
        });
    }

    loadSites(): void {
        this.loading.set(true);
        this.siteService.getAll().subscribe({
            next: (data: Site[]) => {
                this.sites.set(data);
                this.loading.set(false);
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: this.errorMessage(err, 'Impossible de charger les sites')
                });
                this.loading.set(false);
            }
        });
    }

    loadLocalisations(): void {
        // Utiliser getAllLocalisations$() qui retourne Observable<IResponse>
        this.localisationService.getAllLocalisations$().subscribe({
            next: (response: IResponse) => {
                // Extraire le tableau localisations depuis response.data.localisations
                const localisationsList = response.data?.localisations || [];
                this.localisations.set(localisationsList);
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: this.errorMessage(err, 'Impossible de charger les localisations')
                });
            }
        });
    }

    loadVilles(): void {
        this.villeService.getActiveVilles$().subscribe({
            next: (response: IResponse) => this.villes.set(response.data?.villes || []),
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: this.errorMessage(err, 'Impossible de charger les villes (liste déroulante indisponible)')
                });
            }
        });
    }

    // Pré-remplit la ville quand la localisation choisie en a une (dérivée du quartier)
    onLocalisationChange(localisationUuid: string | null): void {
        if (!localisationUuid || this.siteForm.get('villeUuid')?.value) return;
        const loc = this.localisations().find((l) => l.localisationUuid === localisationUuid);
        if (loc?.villeUuid) {
            this.siteForm.patchValue({ villeUuid: loc.villeUuid });
        }
    }

    openNewDialog(): void {
        this.isEditMode.set(false);
        this.selectedSite.set(null);
        this.siteForm.reset({ typeSite: 'GARE_ROUTIERE', actif: true });
        this.dialogVisible.set(true);
    }

    openEditDialog(site: Site): void {
        this.isEditMode.set(true);
        this.selectedSite.set(site);
        this.siteForm.patchValue({
            localisationUuid: site.localisationUuid,
            villeUuid: site.villeUuid || '',
            nom: site.nom,
            description: site.description,
            typeSite: site.typeSite,
            capaciteVehicules: site.capaciteVehicules,
            telephone: site.telephone,
            email: site.email,
            horaireOuverture: site.horaireOuverture,
            horaireFermeture: site.horaireFermeture,
            imageUrl: site.imageUrl,
            actif: site.actif
        });
        this.dialogVisible.set(true);
    }

    closeDialog(): void {
        this.dialogVisible.set(false);
        this.siteForm.reset();
        this.selectedSite.set(null);
    }

    saveSite(): void {
        if (this.siteForm.invalid) {
            this.siteForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        const request: SiteRequest = this.siteForm.value;
        this.loading.set(true);

        if (this.isEditMode() && this.selectedSite()) {
            this.siteService.update(this.selectedSite()!.siteUuid!, request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Site mis à jour avec succès'
                    });
                    this.loadSites();
                    this.closeDialog();
                },
                error: (err: any) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: this.errorMessage(err, 'Impossible de mettre à jour le site')
                    });
                    this.loading.set(false);
                }
            });
        } else {
            this.siteService.create(request).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Site créé avec succès'
                    });
                    this.loadSites();
                    this.closeDialog();
                },
                error: (err: any) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: this.errorMessage(err, 'Impossible de créer le site')
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    toggleActif(site: Site): void {
        this.siteService.toggleActif(site.siteUuid!).subscribe({
            next: (updated: Site) => {
                const message = updated.actif ? 'Site activé' : 'Site désactivé';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: message
                });
                this.loadSites();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: this.errorMessage(err, 'Impossible de modifier le statut')
                });
            }
        });
    }

    confirmDelete(site: Site): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le site "${site.nom}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteSite(site)
        });
    }

    private deleteSite(site: Site): void {
        this.siteService.delete(site.siteUuid!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Site supprimé avec succès'
                });
                this.loadSites();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: this.errorMessage(err, 'Impossible de supprimer le site')
                });
            }
        });
    }

    getTypeSiteLabel(value: string): string {
        const type = this.typeSites.find((t) => t.value === value);
        return type ? type.label : value;
    }

    getTypeSiteSeverity(value: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (value) {
            case 'GARE_ROUTIERE':
                return 'info';
            case 'AEROPORT':
                return 'success';
            case 'PORT':
                return 'warn';
            case 'GARE_FERROVIAIRE':
                return 'danger';
            case 'STATION':
                return 'secondary';
            default:
                return 'contrast';
        }
    }

    getLocalisationLabel(loc: ILocalisation): string {
        const parts: string[] = [];
        if (loc.adresseComplete) {
            parts.push(loc.adresseComplete);
        } else {
            if (loc.quartierLibelle) parts.push(loc.quartierLibelle);
            if (loc.communeLibelle) parts.push(loc.communeLibelle);
            if (loc.villeLibelle) parts.push(loc.villeLibelle);
        }
        return parts.join(', ') || `Localisation ${loc.localisationUuid?.substring(0, 8)}`;
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    // Les services transforment les erreurs HTTP en string (handleError) avant de les relancer.
    private errorMessage(err: unknown, fallback: string): string {
        return typeof err === 'string' && err ? err : fallback;
    }
}
