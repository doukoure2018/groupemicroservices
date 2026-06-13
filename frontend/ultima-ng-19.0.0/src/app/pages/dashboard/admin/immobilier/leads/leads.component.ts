import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImmobilierLeadsService } from '@/service/immobilier-leads.service';
import { ILeadContactView, ILeadVisiteView, IProprietaire } from '@/interface/lead';
import { IPropriete } from '@/interface/propriete';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ImageModule } from 'primeng/image';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';

type LeadKind = 'contact' | 'visite';

interface TraiterDialog {
    open: boolean;
    kind: LeadKind;
    uuid: string;
    label: string;
    submitting: boolean;
}

interface DetailDialog {
    open: boolean;
    loading: boolean;
    submitting: boolean;
    kind: LeadKind;
    uuid: string;
    label: string;
    propriete: IPropriete | null;
    proprietaire: IProprietaire | null;
}

interface LeadsState {
    loadingContacts: boolean;
    loadingVisites: boolean;
    contacts: ILeadContactView[];
    visites: ILeadVisiteView[];
    totalContacts: number;
    totalVisites: number;
    dialog: TraiterDialog;
    detail: DetailDialog;
}

const EMPTY_DIALOG: TraiterDialog = { open: false, kind: 'contact', uuid: '', label: '', submitting: false };
const EMPTY_DETAIL: DetailDialog = { open: false, loading: false, submitting: false, kind: 'contact', uuid: '', label: '', propriete: null, proprietaire: null };

@Component({
    selector: 'app-immobilier-leads',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextarea,
        DialogModule,
        ToastModule,
        TagModule,
        TooltipModule,
        CardModule,
        ProgressSpinnerModule,
        ImageModule,
        DividerModule,
        TabsModule
    ],
    providers: [MessageService],
    templateUrl: './leads.component.html',
    styleUrl: './leads.component.scss'
})
export class ImmobilierLeadsComponent implements OnInit {
    private leadsService = inject(ImmobilierLeadsService);
    private messageService = inject(MessageService);

    state = signal<LeadsState>({
        loadingContacts: false,
        loadingVisites: false,
        contacts: [],
        visites: [],
        totalContacts: 0,
        totalVisites: 0,
        dialog: { ...EMPTY_DIALOG },
        detail: { ...EMPTY_DETAIL }
    });

    /** Note interne saisie (partagée par le dialog rapide et le détail). */
    noteText = '';

    contacts = computed(() => this.state().contacts);
    visites = computed(() => this.state().visites);
    loadingContacts = computed(() => this.state().loadingContacts);
    loadingVisites = computed(() => this.state().loadingVisites);
    totalContacts = computed(() => this.state().totalContacts);
    totalVisites = computed(() => this.state().totalVisites);
    dialog = computed(() => this.state().dialog);
    detail = computed(() => this.state().detail);

    ngOnInit(): void {
        this.loadContacts();
        this.loadVisites();
    }

    loadContacts(): void {
        this.patch({ loadingContacts: true });
        this.leadsService.getContacts$('NOUVEAU', 50, 0).subscribe({
            next: (r) => this.patch({ loadingContacts: false, contacts: r.data.contacts || [], totalContacts: r.data.total || 0 }),
            error: (e) => {
                this.patch({ loadingContacts: false });
                this.showError(e);
            }
        });
    }

    loadVisites(): void {
        this.patch({ loadingVisites: true });
        this.leadsService.getVisites$('NOUVEAU', 50, 0).subscribe({
            next: (r) => this.patch({ loadingVisites: false, visites: r.data.visites || [], totalVisites: r.data.total || 0 }),
            error: (e) => {
                this.patch({ loadingVisites: false });
                this.showError(e);
            }
        });
    }

    refresh(): void {
        this.loadContacts();
        this.loadVisites();
    }

    // ── Dialog rapide « Traiter » ──
    openTraiter(kind: LeadKind, uuid: string, label: string): void {
        this.noteText = '';
        this.patch({ dialog: { open: true, kind, uuid, label, submitting: false } });
    }

    closeTraiter(): void {
        this.noteText = '';
        this.patch({ dialog: { ...EMPTY_DIALOG } });
    }

    submitTraiter(action: 'TRAITE' | 'REJETE'): void {
        const d = this.dialog();
        if (!d.uuid || d.submitting) return;
        this.patch({ dialog: { ...d, submitting: true } });
        this.executeTraiter(d.kind, d.uuid, action, () => this.closeTraiter(), (ok) => {
            if (!ok) this.patch({ dialog: { ...this.dialog(), submitting: false } });
        });
    }

    // ── Dialog « Voir l'annonce » (détail propriété) ──
    openAnnonce(kind: LeadKind, leadUuid: string, label: string, proprieteUuid: string): void {
        this.noteText = '';
        this.patch({ detail: { open: true, loading: true, submitting: false, kind, uuid: leadUuid, label, propriete: null, proprietaire: null } });
        // Annonce (bloquant pour l'affichage principal).
        this.leadsService.getProprieteDetail$(proprieteUuid).subscribe({
            next: (r) => this.patch({ detail: { ...this.detail(), loading: false, propriete: (r.data.propriete as IPropriete) ?? null } }),
            error: (e) => {
                this.patch({ detail: { ...EMPTY_DETAIL } });
                this.showError(e);
            }
        });
        // Propriétaire (non bloquant : si échec, on garde l'annonce sans la carte propriétaire).
        this.leadsService.getProprietaire$(proprieteUuid).subscribe({
            next: (r) => this.patch({ detail: { ...this.detail(), proprietaire: (r.data.proprietaire as IProprietaire) ?? null } }),
            error: () => {}
        });
    }

    closeDetail(): void {
        this.noteText = '';
        this.patch({ detail: { ...EMPTY_DETAIL } });
    }

    submitTraiterFromDetail(action: 'TRAITE' | 'REJETE'): void {
        const d = this.detail();
        if (!d.uuid || d.submitting) return;
        this.patch({ detail: { ...d, submitting: true } });
        this.executeTraiter(d.kind, d.uuid, action, () => this.closeDetail(), (ok) => {
            if (!ok) this.patch({ detail: { ...this.detail(), submitting: false } });
        });
    }

    /** Cœur du traitement, partagé : appelle l'API, retire le lead de la liste, toast. */
    private executeTraiter(kind: LeadKind, leadUuid: string, action: 'TRAITE' | 'REJETE', onDone: () => void, onSettled: (ok: boolean) => void): void {
        const note = this.noteText.trim();
        const request = { action, noteAdmin: note.length ? note : undefined };
        const call$ = kind === 'contact' ? this.leadsService.traiterContact$(leadUuid, request) : this.leadsService.traiterVisite$(leadUuid, request);

        call$.subscribe({
            next: (r) => {
                if (kind === 'contact') {
                    this.patch({
                        contacts: this.contacts().filter((c) => c.contact.contactUuid !== leadUuid),
                        totalContacts: Math.max(0, this.totalContacts() - 1)
                    });
                } else {
                    this.patch({
                        visites: this.visites().filter((v) => v.visite.visiteUuid !== leadUuid),
                        totalVisites: Math.max(0, this.totalVisites() - 1)
                    });
                }
                onDone();
                this.showSuccess(r.message || (action === 'TRAITE' ? 'Lead traité' : 'Lead rejeté'));
                onSettled(true);
            },
            error: (e) => {
                this.showError(e);
                onSettled(false);
            }
        });
    }

    statutSeverity(statut: string): 'success' | 'warn' | 'danger' | 'secondary' {
        if (statut === 'TRAITE') return 'success';
        if (statut === 'NOUVEAU') return 'warn';
        if (statut === 'REJETE') return 'danger';
        return 'secondary';
    }

    formatPrix(p: IPropriete | null): string {
        if (!p) return '';
        if (p.prixSurDemande) return 'Prix sur demande';
        const montant = new Intl.NumberFormat('fr-FR').format(p.prix);
        return `${montant} ${p.devise}`;
    }

    detailPhotoUrl(p: IPropriete | null): string | null {
        if (!p) return null;
        const cover = p.photoCouverture ?? p.photos?.[0];
        return cover?.url || cover?.urlThumbnail || null;
    }

    private patch(partial: Partial<LeadsState>): void {
        this.state.update((c) => ({ ...c, ...partial }));
    }

    private showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: message, life: 3000 });
    }

    private showError(error: string): void {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error, life: 5000 });
    }
}
