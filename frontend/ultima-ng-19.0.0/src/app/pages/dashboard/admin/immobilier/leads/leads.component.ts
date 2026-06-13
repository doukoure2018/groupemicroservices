import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImmobilierLeadsService } from '@/service/immobilier-leads.service';
import { ILeadContactView, ILeadVisiteView } from '@/interface/lead';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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

interface LeadsState {
    loadingContacts: boolean;
    loadingVisites: boolean;
    contacts: ILeadContactView[];
    visites: ILeadVisiteView[];
    totalContacts: number;
    totalVisites: number;
    dialog: TraiterDialog;
}

const EMPTY_DIALOG: TraiterDialog = { open: false, kind: 'contact', uuid: '', label: '', submitting: false };

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
        dialog: { ...EMPTY_DIALOG }
    });

    /** Note interne saisie dans le dialog (champ libre, hors signal pour ngModel propre). */
    noteText = '';

    contacts = computed(() => this.state().contacts);
    visites = computed(() => this.state().visites);
    loadingContacts = computed(() => this.state().loadingContacts);
    loadingVisites = computed(() => this.state().loadingVisites);
    totalContacts = computed(() => this.state().totalContacts);
    totalVisites = computed(() => this.state().totalVisites);
    dialog = computed(() => this.state().dialog);

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

        const note = this.noteText.trim();
        const request = { action, noteAdmin: note.length ? note : undefined };
        const call$ = d.kind === 'contact' ? this.leadsService.traiterContact$(d.uuid, request) : this.leadsService.traiterVisite$(d.uuid, request);

        call$.subscribe({
            next: (r) => {
                // Le lead passe NOUVEAU → action : il quitte le filtre NOUVEAU, on le retire de la liste.
                if (d.kind === 'contact') {
                    this.patch({
                        contacts: this.contacts().filter((c) => c.contact.contactUuid !== d.uuid),
                        totalContacts: Math.max(0, this.totalContacts() - 1)
                    });
                } else {
                    this.patch({
                        visites: this.visites().filter((v) => v.visite.visiteUuid !== d.uuid),
                        totalVisites: Math.max(0, this.totalVisites() - 1)
                    });
                }
                this.closeTraiter();
                this.showSuccess(r.message || (action === 'TRAITE' ? 'Lead traité' : 'Lead rejeté'));
            },
            error: (e) => {
                this.patch({ dialog: { ...this.dialog(), submitting: false } });
                this.showError(e);
            }
        });
    }

    statutSeverity(statut: string): 'success' | 'warn' | 'danger' | 'secondary' {
        if (statut === 'TRAITE') return 'success';
        if (statut === 'NOUVEAU') return 'warn';
        if (statut === 'REJETE') return 'danger';
        return 'secondary';
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
