import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AgenceOnboardingService, IOnboardingAgenceRequest } from '@/service/agence-onboarding.service';
import { RegionService } from '@/service/region.service';
import { CommuneService } from '@/service/commune.service';
import { IRegion } from '@/interface/region';
import { ICommune } from '@/interface/commune';

/**
 * Espace agence (rôle ADMIN_IMMO) — complétion du profil puis suivi du
 * statut de validation par la conformité (SLA affiché : sous 24 h).
 */
@Component({
    selector: 'app-agence-onboarding',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, MessageModule, ToastModule, TagModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            @switch (statut()) {
                @case ('EN_VALIDATION') {
                    <div class="flex flex-col items-center gap-4 py-12 text-center">
                        <i class="pi pi-hourglass !text-5xl text-orange-500"></i>
                        <h2 class="m-0 text-2xl font-semibold">En cours de validation par la conformité</h2>
                        <p class="m-0 text-surface-600 dark:text-surface-300">
                            Votre dossier a bien été soumis. Notre équipe conformité vérifie vos informations
                            et votre document RCCM/NIF — <b>réponse sous 24 heures</b>.
                            Vous recevrez un email dès la décision.
                        </p>
                        <p-tag severity="warn" value="Soumis le {{ agence()?.dateSoumissionConformite | date: 'dd/MM/yyyy HH:mm' }}" />
                    </div>
                }
                @case ('VERIFIE') {
                    <div class="flex flex-col items-center gap-4 py-12 text-center">
                        <i class="pi pi-verified !text-5xl text-green-500"></i>
                        <h2 class="m-0 text-2xl font-semibold">Agence vérifiée ✓</h2>
                        <p class="m-0 text-surface-600 dark:text-surface-300">
                            Votre agence <b>{{ agence()?.nom }}</b> est validée par la conformité.
                            Votre espace de travail sera bientôt enrichi (annonces, demandes clients…).
                        </p>
                    </div>
                }
                @default {
                    @if (statut() === 'REJETE') {
                        <p-message severity="error" styleClass="mb-4 w-full">
                            Dossier rejeté par la conformité{{ agence()?.motifRejet ? ' : ' + agence()?.motifRejet : '' }}.
                            Corrigez vos informations puis soumettez à nouveau.
                        </p-message>
                    } @else {
                        <p-message severity="info" styleClass="mb-4 w-full">
                            Complétez le profil de votre agence puis soumettez-le : la conformité le validera <b>sous 24 h</b>.
                        </p-message>
                    }

                    <h2 class="mt-0 text-xl font-semibold">Profil de l'agence</h2>
                    <form #form="ngForm" (ngSubmit)="save(form)" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div class="flex flex-col gap-1">
                            <label for="nom" class="font-medium">Nom de l'agence *</label>
                            <input pInputText id="nom" name="nom" [(ngModel)]="model.nom" required />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="numeroRegistre" class="font-medium">RCCM ou code NIF *</label>
                            <input pInputText id="numeroRegistre" name="numeroRegistre" [(ngModel)]="model.numeroRegistre" required />
                        </div>
                        <div class="flex flex-col gap-1 md:col-span-2">
                            <label for="adresse" class="font-medium">Adresse *</label>
                            <input pInputText id="adresse" name="adresse" [(ngModel)]="model.adresse" required />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-medium">Région *</label>
                            <p-select name="regionId" [(ngModel)]="model.regionId" [options]="regions()" optionLabel="libelle" optionValue="regionId" placeholder="Choisir la région" required />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="font-medium">Commune *</label>
                            <p-select name="communeId" [(ngModel)]="model.communeId" [options]="communes()" optionLabel="libelle" optionValue="communeId" placeholder="Choisir la commune" [filter]="true" required />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="email" class="font-medium">Email professionnel *</label>
                            <input pInputText id="email" name="email" type="email" [(ngModel)]="model.email" required email />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="telephone" class="font-medium">Contact pour joindre *</label>
                            <input pInputText id="telephone" name="telephone" [(ngModel)]="model.telephone" placeholder="+224 6XX XX XX XX" required />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="telephoneWhatsapp" class="font-medium">Contact WhatsApp</label>
                            <input pInputText id="telephoneWhatsapp" name="telephoneWhatsapp" [(ngModel)]="model.telephoneWhatsapp" placeholder="+224 6XX XX XX XX" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label for="raisonSociale" class="font-medium">Raison sociale</label>
                            <input pInputText id="raisonSociale" name="raisonSociale" [(ngModel)]="model.raisonSociale" />
                        </div>
                        <div class="flex flex-col gap-1 md:col-span-2">
                            <label for="description" class="font-medium">Description</label>
                            <textarea pTextarea id="description" name="description" [(ngModel)]="model.description" rows="3"></textarea>
                        </div>

                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label class="font-medium">Document RCCM (PDF ou image, max 20 MB) *</label>
                            @if (agence()?.documentsKycUrl) {
                                <p-message severity="success" styleClass="w-full">
                                    Document uploadé — <a [href]="agence()?.documentsKycUrl" target="_blank" class="underline">voir le fichier</a>
                                </p-message>
                            } @else if (!agence()) {
                                <p-message severity="secondary" styleClass="w-full">Enregistrez d'abord les informations ci-dessus pour pouvoir uploader le document.</p-message>
                            }
                            <input type="file" accept=".pdf,image/*" (change)="onFileSelected($event)" [disabled]="!agence() || uploading()" class="block" />
                            @if (uploading()) {
                                <p-message severity="info" styleClass="w-full"><i class="pi pi-spin pi-spinner mr-2"></i>Upload du document en cours…</p-message>
                            }
                        </div>

                        <div class="flex flex-col gap-2 md:col-span-2">
                            @if (!canSubmit()) {
                                <p-message severity="warn" styleClass="w-full">
                                    Pour soumettre à la conformité : {{ missingForSubmit() }}
                                </p-message>
                            }
                            <div class="flex flex-wrap gap-3">
                                <button pButton type="submit" label="Enregistrer" icon="pi pi-save" [disabled]="form.invalid || saving()" [loading]="saving()"></button>
                                <button pButton type="button" label="Soumettre à la conformité" icon="pi pi-send" severity="warn" [disabled]="!canSubmit() || submitting()" [loading]="submitting()" (click)="soumettre()"></button>
                            </div>
                        </div>
                    </form>
                }
            }
        </div>
    `
})
export class AgenceOnboardingComponent implements OnInit {
    private onboardingService = inject(AgenceOnboardingService);
    private regionService = inject(RegionService);
    private communeService = inject(CommuneService);
    private messageService = inject(MessageService);

    statut = signal<string>('PROFIL_INCOMPLET');
    agence = signal<any | undefined>(undefined);
    regions = signal<IRegion[]>([]);
    communes = signal<ICommune[]>([]);
    saving = signal(false);
    submitting = signal(false);
    uploading = signal(false);
    selectedFile?: File;

    model: Partial<IOnboardingAgenceRequest> = {};

    ngOnInit(): void {
        this.refresh();
        this.regionService.getAllRegions$().subscribe({ next: (r) => this.regions.set(r.data?.['regions'] ?? []) });
        this.communeService.getAllCommunes$().subscribe({ next: (r) => this.communes.set(r.data?.['communes'] ?? []) });
    }

    refresh(): void {
        this.onboardingService.getMe$().subscribe({
            next: (response) => {
                this.statut.set(response.data?.['statut'] ?? 'PROFIL_INCOMPLET');
                const agence = response.data?.['agence'];
                this.agence.set(agence);
                if (agence) {
                    this.model = {
                        nom: agence.nom,
                        raisonSociale: agence.raisonSociale,
                        numeroRegistre: agence.numeroRegistre,
                        adresse: agence.adresse,
                        communeId: agence.communeId,
                        regionId: agence.regionId,
                        email: agence.email,
                        telephone: agence.telephone,
                        telephoneWhatsapp: agence.telephoneWhatsapp,
                        description: agence.description
                    };
                }
            },
            error: (error) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error })
        });
    }

    save(form: NgForm): void {
        if (form.invalid) return;
        this.saving.set(true);
        this.onboardingService.save$(this.model as IOnboardingAgenceRequest).subscribe({
            next: (response) => {
                this.saving.set(false);
                this.agence.set(response.data?.['agence']);
                this.messageService.add({ severity: 'success', summary: 'Enregistré', detail: response.message });
            },
            error: (error) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
            }
        });
    }

    /** Upload automatique dès la sélection du fichier. */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0];
        if (this.selectedFile) {
            this.uploadRccm();
            input.value = '';
        }
    }

    uploadRccm(): void {
        if (!this.selectedFile) return;
        this.uploading.set(true);
        this.onboardingService.uploadRccm$(this.selectedFile).subscribe({
            next: (response) => {
                this.uploading.set(false);
                this.selectedFile = undefined;
                this.agence.set(response.data?.['agence']);
                this.messageService.add({ severity: 'success', summary: 'Document uploadé', detail: response.message });
            },
            error: (error) => {
                this.uploading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
            }
        });
    }

    canSubmit(): boolean {
        const a = this.agence();
        return !!a && !!a.numeroRegistre && !!a.adresse && !!a.communeId && !!a.regionId && !!a.email && !!a.telephone && !!a.documentsKycUrl;
    }

    /** Liste lisible de ce qui manque pour activer la soumission. */
    missingForSubmit(): string {
        const a = this.agence();
        if (!a) return 'enregistrez d’abord les informations de votre agence.';
        const missing: string[] = [];
        if (!a.numeroRegistre) missing.push('RCCM/NIF');
        if (!a.adresse) missing.push('adresse');
        if (!a.communeId) missing.push('commune');
        if (!a.regionId) missing.push('région');
        if (!a.email) missing.push('email professionnel');
        if (!a.telephone) missing.push('téléphone');
        if (!a.documentsKycUrl) missing.push('document RCCM à uploader');
        return missing.length ? 'il manque : ' + missing.join(', ') + '.' : '';
    }

    soumettre(): void {
        this.submitting.set(true);
        this.onboardingService.soumettre$().subscribe({
            next: (response) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'success', summary: 'Dossier soumis', detail: response.message });
                this.refresh();
            },
            error: (error) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
            }
        });
    }
}
