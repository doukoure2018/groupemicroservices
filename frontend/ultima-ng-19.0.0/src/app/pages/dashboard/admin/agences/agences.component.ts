import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AgenceAdminService } from '@/service/agence-admin.service';

/**
 * Écran admin « Agences » : synthèse (compteurs d'activité par agence) +
 * détail au clic (annonces, agents, représentant).
 */
@Component({
    selector: 'app-agences',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TagModule, DialogModule, ToastModule, TooltipModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="m-0 text-xl font-semibold">Agences immobilières</h2>
                <div class="flex items-center gap-3">
                    <p-tag severity="info" [value]="total() + ' agence(s)'" />
                    <button pButton icon="pi pi-refresh" [rounded]="true" [text]="true" (click)="load()" [loading]="loading()"></button>
                </div>
            </div>

            <p-table [value]="agences()" [loading]="loading()" [rows]="20" [paginator]="agences().length > 20" dataKey="agenceUuid">
                <ng-template #header>
                    <tr>
                        <th>Agence</th>
                        <th>Représentant</th>
                        <th>Zone</th>
                        <th>Statut</th>
                        <th class="text-center">Annonces</th>
                        <th class="text-center">Agents</th>
                        <th>Inscrite le</th>
                        <th></th>
                    </tr>
                </ng-template>
                <ng-template #body let-a>
                    <tr>
                        <td>
                            <div class="font-semibold">{{ a.nom }}</div>
                            <div class="text-sm text-surface-500">{{ a.numeroRegistre }}</div>
                        </td>
                        <td>{{ a.representantNom || '—' }}</td>
                        <td>{{ a.communeLibelle ? a.communeLibelle + (a.regionLibelle ? ', ' + a.regionLibelle : '') : '—' }}</td>
                        <td><p-tag [severity]="statutSeverity(a.statutVerification)" [value]="statutLabel(a.statutVerification)" /></td>
                        <td class="text-center">
                            <span class="font-semibold">{{ a.nbAnnoncesPubliees }}</span>
                            <span class="text-surface-500"> / {{ a.nbAnnoncesTotal }}</span>
                        </td>
                        <td class="text-center">{{ a.nbAgents }}</td>
                        <td class="whitespace-nowrap">{{ a.createdAt | date: 'dd/MM/yyyy' }}</td>
                        <td>
                            <button pButton icon="pi pi-eye" label="Détail" size="small" [outlined]="true" (click)="openDetail(a)"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="py-8 text-center text-surface-500">
                            <i class="pi pi-building !text-3xl mb-2 block"></i>
                            Aucune agence enregistrée.
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Détail agence -->
        <p-dialog [header]="detailAgence()?.nom || 'Agence'" [(visible)]="detailVisible" [modal]="true" [style]="{ width: '52rem' }" [dismissableMask]="true">
            @if (detailLoading()) {
                <div class="py-10 text-center"><i class="pi pi-spin pi-spinner !text-2xl"></i></div>
            } @else if (detailAgence()) {
                <div class="flex flex-col gap-5">
                    <!-- En-tête -->
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><span class="text-surface-500">Représentant :</span> <b>{{ detailRepresentant() || '—' }}</b></div>
                        <div><span class="text-surface-500">RCCM/NIF :</span> {{ detailAgence().numeroRegistre || '—' }}</div>
                        <div><span class="text-surface-500">Email :</span> {{ detailAgence().email || '—' }}</div>
                        <div><span class="text-surface-500">Téléphone :</span> {{ detailAgence().telephone || '—' }}</div>
                        <div><span class="text-surface-500">Statut :</span> <p-tag [severity]="statutSeverity(detailAgence().statutVerification)" [value]="statutLabel(detailAgence().statutVerification)" /></div>
                        <div><span class="text-surface-500">Adresse :</span> {{ detailAgence().adresse || '—' }}</div>
                    </div>

                    <!-- Agents -->
                    <div>
                        <h4 class="mb-2 font-semibold">Agents ({{ detailAgents().length }})</h4>
                        @if (detailAgents().length) {
                            <ul class="m-0 pl-4 list-disc text-sm">
                                @for (ag of detailAgents(); track ag.profilUuid) {
                                    <li>{{ ag.nomAffichage || ag.typeProfil }}</li>
                                }
                            </ul>
                        } @else {
                            <p class="text-sm text-surface-500 m-0">Aucun agent.</p>
                        }
                    </div>

                    <!-- Annonces -->
                    <div>
                        <h4 class="mb-2 font-semibold">Annonces ({{ detailAnnonces().length }})</h4>
                        @if (detailAnnonces().length) {
                            <p-table [value]="detailAnnonces()" [rows]="5" [paginator]="detailAnnonces().length > 5">
                                <ng-template #header>
                                    <tr><th>Référence</th><th>Titre</th><th>Type</th><th>Statut</th></tr>
                                </ng-template>
                                <ng-template #body let-p>
                                    <tr>
                                        <td class="text-sm">{{ p.reference }}</td>
                                        <td class="text-sm">{{ p.titre }}</td>
                                        <td><p-tag [severity]="p.typeAnnonce === 'LOCATION' ? 'info' : 'warn'" [value]="p.typeAnnonce" /></td>
                                        <td class="text-sm">{{ p.statut }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        } @else {
                            <p class="text-sm text-surface-500 m-0">Aucune annonce.</p>
                        }
                    </div>
                </div>
            }
        </p-dialog>
    `
})
export class AgencesComponent implements OnInit {
    private agenceAdminService = inject(AgenceAdminService);
    private messageService = inject(MessageService);

    agences = signal<any[]>([]);
    total = signal(0);
    loading = signal(false);

    detailVisible = false;
    detailLoading = signal(false);
    detailAgence = signal<any | undefined>(undefined);
    detailRepresentant = signal<string>('');
    detailAgents = signal<any[]>([]);
    detailAnnonces = signal<any[]>([]);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.agenceAdminService.getAgences$().subscribe({
            next: (r) => {
                this.loading.set(false);
                this.agences.set(r.data?.['agences'] ?? []);
                this.total.set(r.data?.['total'] ?? 0);
            },
            error: (e) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: String(e) });
            }
        });
    }

    openDetail(a: any): void {
        this.detailAgence.set(a);
        this.detailRepresentant.set(a.representantNom ?? '');
        this.detailAgents.set([]);
        this.detailAnnonces.set([]);
        this.detailVisible = true;
        this.detailLoading.set(true);
        this.agenceAdminService.getDetail$(a.agenceUuid).subscribe({
            next: (r) => {
                this.detailLoading.set(false);
                this.detailAgence.set(r.data?.['agence'] ?? a);
                this.detailRepresentant.set(r.data?.['representantNom'] ?? a.representantNom ?? '');
                this.detailAgents.set(r.data?.['agents'] ?? []);
                this.detailAnnonces.set(r.data?.['annonces'] ?? []);
            },
            error: (e) => {
                this.detailLoading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: String(e) });
            }
        });
    }

    statutLabel(s: string): string {
        return (
            {
                PROFIL_INCOMPLET: 'Profil incomplet',
                EN_ATTENTE: 'En attente',
                EN_VALIDATION: 'En validation',
                VERIFIE: 'Vérifiée',
                REJETE: 'Rejetée'
            }[s] ?? s
        );
    }

    statutSeverity(s: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        return (
            ({ VERIFIE: 'success', EN_VALIDATION: 'warn', REJETE: 'danger', EN_ATTENTE: 'info', PROFIL_INCOMPLET: 'secondary' } as const)[s] ?? 'secondary'
        );
    }
}
