import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImmobilierModerationService } from '@/service/immobilier-moderation.service';
import { IPropriete, IProprieteDetail, IVendeur } from '@/interface/propriete';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ImageModule } from 'primeng/image';
import { RippleModule } from 'primeng/ripple';
import { GalleriaModule } from 'primeng/galleria';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, ConfirmEventType, MessageService } from 'primeng/api';

interface ModerationState {
    loading: boolean;
    proprietes: IPropriete[];
    total: number;
    selected: IPropriete | null;
    isRejectDialogOpen: boolean;
    isDetailOpen: boolean;
    detailLoading: boolean;
    detail: IProprieteDetail | null;
}

@Component({
    selector: 'app-immobilier-moderation',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputTextarea,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        CardModule,
        ProgressSpinnerModule,
        ImageModule,
        RippleModule,
        GalleriaModule,
        ChipModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './moderation.component.html',
    styleUrl: './moderation.component.scss'
})
export class ImmobilierModerationComponent implements OnInit {
    private moderationService = inject(ImmobilierModerationService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    state = signal<ModerationState>({
        loading: false,
        proprietes: [],
        total: 0,
        selected: null,
        isRejectDialogOpen: false,
        isDetailOpen: false,
        detailLoading: false,
        detail: null
    });

    proprietes = computed(() => this.state().proprietes);
    loading = computed(() => this.state().loading);
    total = computed(() => this.state().total);
    selected = computed(() => this.state().selected);
    isRejectDialogOpen = computed(() => this.state().isRejectDialogOpen);
    isDetailOpen = computed(() => this.state().isDetailOpen);
    detailLoading = computed(() => this.state().detailLoading);
    detail = computed(() => this.state().detail);
    detailPropriete = computed(() => this.detail()?.propriete ?? null);
    detailVendeur = computed<IVendeur | null>(() => this.detail()?.vendeur ?? null);

    rejectForm!: FormGroup;

    readonly motifPlaceholder =
        'Soyez constructif. Exemples :\n• « Photos floues, merci de reuploader des photos plus nettes »\n• « Description incomplète, ajoutez le quartier exact et les commodités »\n• « Le prix annoncé semble incohérent avec la surface »';

    ngOnInit(): void {
        this.rejectForm = this.fb.group({
            motif: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(500)]]
        });
        this.loadModeration();
    }

    loadModeration(): void {
        this.updateState({ loading: true });
        this.moderationService.findEnAttenteModeration$(50, 0).subscribe({
            next: (response) => {
                this.updateState({
                    loading: false,
                    proprietes: response.data.proprietes || [],
                    total: response.data.total || 0
                });
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    openDetail(propriete: IPropriete): void {
        this.updateState({ isDetailOpen: true, detailLoading: true, detail: null });
        this.moderationService.getForModeration$(propriete.proprieteUuid).subscribe({
            next: (response) => {
                this.updateState({
                    detailLoading: false,
                    detail: {
                        propriete: response.data.propriete as IPropriete,
                        vendeur: (response.data.vendeur ?? {}) as IVendeur
                    }
                });
            },
            error: (error) => {
                this.updateState({ detailLoading: false, isDetailOpen: false });
                this.showError(error);
            }
        });
    }

    closeDetail(): void {
        this.updateState({ isDetailOpen: false, detail: null });
    }

    /** Bouton Valider inline (depuis la liste) : force la conscience via 2 actions. */
    confirmValiderInline(propriete: IPropriete): void {
        this.confirmationService.confirm({
            message: `Valider « ${propriete.titre} » sans avoir ouvert le détail ?`,
            header: 'Confirmation rapide',
            icon: 'pi pi-question-circle',
            acceptLabel: "J'ai vérifié, valider",
            rejectLabel: "Voir les détails d'abord",
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => this.valider(propriete),
            reject: (type: ConfirmEventType) => {
                if (type === ConfirmEventType.REJECT) {
                    this.openDetail(propriete);
                }
            }
        });
    }

    /** Bouton Valider depuis le modal détail : admin a déjà vu, simple confirmation. */
    confirmValiderFromDetail(propriete: IPropriete): void {
        this.confirmationService.confirm({
            message: `Publier « ${propriete.titre} » ? L'annonceur sera notifié par email.`,
            header: 'Valider la publication',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Valider et publier',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-success',
            accept: () => {
                this.valider(propriete);
                this.closeDetail();
            }
        });
    }

    private valider(propriete: IPropriete): void {
        this.moderationService.valider$(propriete.proprieteUuid).subscribe({
            next: (response) => {
                this.updateState({
                    proprietes: this.proprietes().filter((p) => p.proprieteUuid !== propriete.proprieteUuid),
                    total: Math.max(0, this.total() - 1)
                });
                this.showSuccess(response.message || 'Annonce validée');
            },
            error: (error) => this.showError(error)
        });
    }

    openRejectDialog(propriete: IPropriete): void {
        this.rejectForm.reset();
        this.updateState({ selected: propriete, isRejectDialogOpen: true });
    }

    closeRejectDialog(): void {
        this.updateState({ selected: null, isRejectDialogOpen: false });
        this.rejectForm.reset();
    }

    onRejectSubmit(): void {
        if (this.rejectForm.invalid || !this.selected()) {
            this.rejectForm.markAllAsTouched();
            return;
        }
        const propriete = this.selected()!;
        const motif = this.rejectForm.value.motif.trim();
        this.updateState({ loading: true });
        this.moderationService.rejeter$(propriete.proprieteUuid, { motif }).subscribe({
            next: (response) => {
                const wasOpenFromDetail = this.isDetailOpen();
                this.updateState({
                    loading: false,
                    proprietes: this.proprietes().filter((p) => p.proprieteUuid !== propriete.proprieteUuid),
                    total: Math.max(0, this.total() - 1),
                    isRejectDialogOpen: false,
                    selected: null,
                    isDetailOpen: wasOpenFromDetail ? false : this.isDetailOpen(),
                    detail: wasOpenFromDetail ? null : this.detail()
                });
                this.rejectForm.reset();
                this.showSuccess(response.message || 'Annonce rejetée — annonceur notifié');
            },
            error: (error) => {
                this.updateState({ loading: false });
                this.showError(error);
            }
        });
    }

    private updateState(partial: Partial<ModerationState>): void {
        this.state.update((c) => ({ ...c, ...partial }));
    }

    private showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: message, life: 3000 });
    }

    private showError(error: string): void {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error, life: 5000 });
    }

    formatPrix(propriete: IPropriete): string {
        if (propriete.prixSurDemande) return 'Sur demande';
        const formatted = new Intl.NumberFormat('fr-FR').format(propriete.prix);
        const suffix = propriete.typeAnnonce === 'LOCATION' && propriete.periode ? ` / ${this.formatPeriode(propriete.periode)}` : '';
        return `${formatted} ${propriete.devise}${suffix}`;
    }

    private formatPeriode(periode: string): string {
        const map: Record<string, string> = {
            PAR_MOIS: 'mois',
            PAR_JOUR: 'jour',
            PAR_SEMAINE: 'semaine',
            PAR_ANNEE: 'an',
            UNIQUE: ''
        };
        return map[periode] ?? periode.toLowerCase();
    }

    photoUrl(propriete: IPropriete): string | null {
        const cover = propriete.photoCouverture ?? propriete.photos?.[0];
        return cover?.urlThumbnail || cover?.url || null;
    }

    googleMapsLink(propriete: IPropriete): string | null {
        if (propriete.latitude == null || propriete.longitude == null) return null;
        return `https://www.google.com/maps/search/?api=1&query=${propriete.latitude},${propriete.longitude}`;
    }

    formatTypeProfil(type?: string): string {
        const map: Record<string, string> = {
            PROPRIETAIRE_SIMPLE: 'Propriétaire',
            DEMARCHEUR: 'Démarcheur',
            AGENT_AGENCE: 'Agent agence'
        };
        return type ? map[type] ?? type : '—';
    }

    statutVerificationSeverity(statut?: string): 'success' | 'warn' | 'danger' | 'secondary' {
        if (statut === 'VERIFIE') return 'success';
        if (statut === 'EN_ATTENTE') return 'warn';
        if (statut === 'REJETE') return 'danger';
        return 'secondary';
    }

    isMotifInvalid(): boolean {
        const f = this.rejectForm.get('motif');
        return f ? f.invalid && f.touched : false;
    }

    motifError(): string {
        const f = this.rejectForm.get('motif');
        if (f?.errors) {
            if (f.errors['required']) return 'Le motif est obligatoire';
            if (f.errors['minlength']) return `Minimum ${f.errors['minlength'].requiredLength} caractères (motif clair pour le vendeur)`;
            if (f.errors['maxlength']) return `Maximum ${f.errors['maxlength'].requiredLength} caractères`;
        }
        return '';
    }
}
