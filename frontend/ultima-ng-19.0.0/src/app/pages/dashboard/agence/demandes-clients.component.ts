import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DemandeClientService } from '@/service/demande-client.service';

/**
 * « Demandes clients » (rôle ADMIN_IMMO, agence vérifiée) : besoins déclarés
 * par les clients mobiles, filtrés par la zone de l'agence (commune/région),
 * avec les coordonnées du client pour la prise de contact.
 */
@Component({
    selector: 'app-demandes-clients',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, ToastModule, SelectButtonModule, TooltipModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="card">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 class="m-0 text-xl font-semibold">Demandes clients</h2>
                <div class="flex items-center gap-3">
                    <p-selectbutton [options]="scopeOptions" [(ngModel)]="scope" optionLabel="label" optionValue="value" (onChange)="load()" [allowEmpty]="false" />
                    <p-tag severity="info" [value]="total() + ' demande(s)'" />
                    <button pButton icon="pi pi-refresh" [rounded]="true" [text]="true" (click)="load()" [loading]="loading()"></button>
                </div>
            </div>

            @if (erreurAcces()) {
                <div class="py-10 text-center text-surface-500">
                    <i class="pi pi-lock !text-3xl mb-2 block"></i>
                    {{ erreurAcces() }}
                </div>
            } @else {
                <p-table [value]="demandes()" [loading]="loading()" [rows]="20" [paginator]="demandes().length > 20" dataKey="demandeUuid">
                    <ng-template #header>
                        <tr>
                            <th>Référence</th>
                            <th>Recherche</th>
                            <th>Zone</th>
                            <th>Budget</th>
                            <th>Précisions</th>
                            <th>Contacter le client</th>
                            <th>Reçue le</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-demande>
                        <tr>
                            <td class="whitespace-nowrap">{{ demande.reference }}</td>
                            <td>
                                <div class="font-semibold">{{ demande.typeBienLibelle || 'Bien immobilier' }}</div>
                                <p-tag [severity]="demande.typeAnnonce === 'LOCATION' ? 'info' : 'warn'" [value]="demande.typeAnnonce === 'LOCATION' ? 'Location' : 'Achat'" />
                                @if (demande.nbChambresMin) {
                                    <div class="mt-1 text-sm text-surface-500">{{ demande.nbChambresMin }}+ chambres</div>
                                }
                            </td>
                            <td>
                                <div>{{ demande.quartierLibelle ? demande.quartierLibelle + ', ' : '' }}{{ demande.communeLibelle }}</div>
                                <div class="text-sm text-surface-500">{{ demande.regionLibelle }}</div>
                            </td>
                            <td class="whitespace-nowrap">
                                @if (demande.budgetMin || demande.budgetMax) {
                                    {{ (demande.budgetMin | number: '1.0-0') || '—' }} à {{ (demande.budgetMax | number: '1.0-0') || '—' }} {{ demande.devise }}
                                } @else {
                                    <span class="text-surface-400">Non précisé</span>
                                }
                            </td>
                            <td class="max-w-72">
                                <span [pTooltip]="demande.description" tooltipPosition="top" class="line-clamp-2 block text-sm">
                                    {{ demande.description || '—' }}
                                </span>
                            </td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    @if (demande.contactTelephone) {
                                        <a [href]="'tel:' + demande.contactTelephone" class="text-primary hover:underline"><i class="pi pi-phone mr-1"></i>{{ demande.contactTelephone }}</a>
                                    }
                                    @if (demande.contactWhatsapp) {
                                        <a [href]="'https://wa.me/' + whatsappNumber(demande.contactWhatsapp)" target="_blank" class="text-green-600 hover:underline"><i class="pi pi-whatsapp mr-1"></i>{{ demande.contactWhatsapp }}</a>
                                    }
                                    @if (!demande.contactTelephone && !demande.contactWhatsapp) {
                                        <span class="text-surface-400">—</span>
                                    }
                                </div>
                            </td>
                            <td class="whitespace-nowrap">{{ demande.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7" class="py-8 text-center text-surface-500">
                                <i class="pi pi-inbox !text-3xl mb-2 block"></i>
                                Aucune demande {{ scope === 'ZONE' ? 'dans votre zone pour le moment' : 'active' }}.
                                @if (scope === 'ZONE') {
                                    <div class="mt-2 text-sm">Essayez le filtre « Toutes les zones ».</div>
                                }
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </div>
    `
})
export class DemandesClientsComponent implements OnInit {
    private demandeService = inject(DemandeClientService);
    private messageService = inject(MessageService);

    demandes = signal<any[]>([]);
    total = signal<number>(0);
    loading = signal(false);
    erreurAcces = signal<string | undefined>(undefined);

    scope: 'ZONE' | 'TOUTES' = 'ZONE';
    scopeOptions = [
        { label: 'Ma zone', value: 'ZONE' },
        { label: 'Toutes les zones', value: 'TOUTES' }
    ];

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.erreurAcces.set(undefined);
        this.demandeService.getDemandes$(this.scope).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.demandes.set(response.data?.['demandes'] ?? []);
                this.total.set(response.data?.['total'] ?? 0);
            },
            error: (error) => {
                this.loading.set(false);
                // 403 typique : agence non encore validée par la conformité
                this.erreurAcces.set(String(error));
                this.messageService.add({ severity: 'warn', summary: 'Accès', detail: error });
            }
        });
    }

    whatsappNumber(raw: string): string {
        return raw.replace(/[^0-9]/g, '');
    }
}
