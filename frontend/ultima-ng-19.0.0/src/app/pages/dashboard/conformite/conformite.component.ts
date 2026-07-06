import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConformiteService } from '@/service/conformite.service';

/**
 * Backoffice conformité (ADMIN_CONFORMITE) : file d'attente des dossiers
 * d'agences soumis, vérification des informations + document RCCM,
 * approbation ou rejet motivé (email automatique à l'agence).
 */
@Component({
    selector: 'app-conformite',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, TextareaModule, TagModule, ToastModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog />
        <div class="card">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="m-0 text-xl font-semibold">Dossiers agence en attente de validation</h2>
                <div class="flex items-center gap-3">
                    <p-tag severity="warn" [value]="total() + ' en attente'" />
                    <button pButton icon="pi pi-refresh" [rounded]="true" [text]="true" (click)="load()" [loading]="loading()"></button>
                </div>
            </div>

            <p-table [value]="dossiers()" [loading]="loading()" [rows]="20" [paginator]="dossiers().length > 20" dataKey="agenceUuid">
                <ng-template #header>
                    <tr>
                        <th>Agence</th>
                        <th>RCCM / NIF</th>
                        <th>Contact</th>
                        <th>Adresse</th>
                        <th>Document</th>
                        <th>Soumis le</th>
                        <th style="width: 12rem">Décision</th>
                    </tr>
                </ng-template>
                <ng-template #body let-dossier>
                    <tr>
                        <td>
                            <div class="font-semibold">{{ dossier.nom }}</div>
                            <div class="text-sm text-surface-500">{{ dossier.raisonSociale }}</div>
                        </td>
                        <td>{{ dossier.numeroRegistre }}</td>
                        <td>
                            <div>{{ dossier.email }}</div>
                            <div class="text-sm text-surface-500">{{ dossier.telephone }}</div>
                            @if (dossier.telephoneWhatsapp) {
                                <div class="text-sm text-green-600"><i class="pi pi-whatsapp mr-1"></i>{{ dossier.telephoneWhatsapp }}</div>
                            }
                        </td>
                        <td>{{ dossier.adresse }}</td>
                        <td>
                            @if (dossier.documentsKycUrl) {
                                <a [href]="dossier.documentsKycUrl" target="_blank" pButton icon="pi pi-file-pdf" label="RCCM" [outlined]="true" size="small"></a>
                            } @else {
                                <p-tag severity="danger" value="Absent" />
                            }
                        </td>
                        <td>{{ dossier.dateSoumissionConformite | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <div class="flex gap-2">
                                <button pButton icon="pi pi-check" label="Approuver" severity="success" size="small" [disabled]="processing()" (click)="confirmApprouver(dossier)"></button>
                                <button pButton icon="pi pi-times" severity="danger" size="small" [outlined]="true" [disabled]="processing()" (click)="openRejet(dossier)"></button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="py-8 text-center text-surface-500">
                            <i class="pi pi-inbox !text-3xl mb-2 block"></i>
                            Aucun dossier en attente — la file est vide.
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog header="Rejeter le dossier" [(visible)]="rejetVisible" [modal]="true" [style]="{ width: '30rem' }">
            <div class="flex flex-col gap-3">
                <span
                    >Dossier : <b>{{ dossierEnCours?.nom }}</b></span
                >
                <label for="motif" class="font-medium">Motif du rejet (envoyé par email à l'agence) *</label>
                <textarea pTextarea id="motif" rows="4" [(ngModel)]="motifRejet" placeholder="Ex. : document RCCM illisible, numéro RCCM invalide…"></textarea>
            </div>
            <ng-template #footer>
                <button pButton label="Annuler" [text]="true" (click)="rejetVisible = false"></button>
                <button pButton label="Rejeter le dossier" severity="danger" icon="pi pi-times" [disabled]="!motifRejet.trim() || processing()" [loading]="processing()" (click)="rejeter()"></button>
            </ng-template>
        </p-dialog>
    `
})
export class ConformiteComponent implements OnInit {
    private conformiteService = inject(ConformiteService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    dossiers = signal<any[]>([]);
    total = signal<number>(0);
    loading = signal(false);
    processing = signal(false);

    rejetVisible = false;
    motifRejet = '';
    dossierEnCours?: any;

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.conformiteService.getDossiers$().subscribe({
            next: (response) => {
                this.loading.set(false);
                this.dossiers.set(response.data?.['agences'] ?? []);
                this.total.set(response.data?.['total'] ?? 0);
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
            }
        });
    }

    confirmApprouver(dossier: any): void {
        this.confirmationService.confirm({
            header: 'Approuver le dossier',
            message: `Valider l'agence « ${dossier.nom} » (RCCM/NIF : ${dossier.numeroRegistre}) ? Un email de confirmation lui sera envoyé.`,
            icon: 'pi pi-check-circle',
            acceptLabel: 'Approuver',
            rejectLabel: 'Annuler',
            accept: () => this.approuver(dossier)
        });
    }

    private approuver(dossier: any): void {
        this.processing.set(true);
        this.conformiteService.approuver$(dossier.agenceUuid).subscribe({
            next: (response) => {
                this.processing.set(false);
                this.messageService.add({ severity: 'success', summary: 'Agence approuvée', detail: response.message });
                this.load();
            },
            error: (error) => {
                this.processing.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
            }
        });
    }

    openRejet(dossier: any): void {
        this.dossierEnCours = dossier;
        this.motifRejet = '';
        this.rejetVisible = true;
    }

    rejeter(): void {
        if (!this.dossierEnCours) return;
        this.processing.set(true);
        this.conformiteService.rejeter$(this.dossierEnCours.agenceUuid, this.motifRejet.trim()).subscribe({
            next: (response) => {
                this.processing.set(false);
                this.rejetVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Dossier rejeté', detail: response.message });
                this.load();
            },
            error: (error) => {
                this.processing.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
            }
        });
    }
}
