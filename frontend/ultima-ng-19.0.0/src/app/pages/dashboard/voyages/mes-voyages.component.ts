import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CommandeClientService } from '@/service/commande-client.service';
import { CommandeClient } from '@/interface/commande.model';

/** Espace « Mes voyages » web : commandes de l'utilisateur, billets QR, annulation. */
@Component({
    selector: 'app-mes-voyages',
    standalone: true,
    imports: [CommonModule, RouterModule, QRCodeComponent, ButtonModule, CardModule, TagModule, ToastModule, ConfirmDialogModule, ProgressSpinnerModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './mes-voyages.component.html',
    styleUrl: './voyages.scss'
})
export class MesVoyagesComponent implements OnInit {
    private readonly commandeService = inject(CommandeClientService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    commandes = signal<CommandeClient[]>([]);
    chargement = signal(true);
    /** Commande dont les billets sont dépliés */
    commandeOuverte = signal<string | null>(null);
    annulationEnCours = signal<string | null>(null);

    ngOnInit(): void {
        this.charger();
    }

    charger(): void {
        this.chargement.set(true);
        this.commandeService.mesCommandes().subscribe({
            next: (commandes) => {
                this.commandes.set(commandes);
                this.chargement.set(false);
            },
            error: (err) => {
                this.chargement.set(false);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: typeof err === 'string' ? err : 'Chargement impossible', life: 5000 });
            }
        });
    }

    toggleBillets(commande: CommandeClient): void {
        this.commandeOuverte.update((c) => (c === commande.commandeUuid ? null : commande.commandeUuid || null));
    }

    peutAnnuler(commande: CommandeClient): boolean {
        if (!['CONFIRMEE', 'PAYEE', 'EN_ATTENTE'].includes(commande.statut || '')) return false;
        // Uniquement les voyages à venir
        return !!commande.dateDepart && commande.dateDepart >= new Date().toISOString().split('T')[0];
    }

    confirmerAnnulation(commande: CommandeClient): void {
        this.confirmationService.confirm({
            header: 'Annuler la réservation',
            message: `Annuler la commande ${commande.numeroCommande} (${commande.villeDepartLibelle} → ${commande.villeArriveeLibelle}) ? Les places seront remises en vente.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, annuler',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.annuler(commande)
        });
    }

    private annuler(commande: CommandeClient): void {
        this.annulationEnCours.set(commande.commandeUuid || null);
        this.commandeService.annuler(commande.commandeUuid!).subscribe({
            next: () => {
                this.annulationEnCours.set(null);
                this.messageService.add({ severity: 'success', summary: 'Réservation annulée', detail: commande.numeroCommande, life: 4000 });
                this.charger();
            },
            error: (err) => {
                this.annulationEnCours.set(null);
                this.messageService.add({ severity: 'error', summary: 'Annulation impossible', detail: typeof err === 'string' ? err : 'Erreur', life: 6000 });
            }
        });
    }

    statutSeverity(statut?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (statut) {
            case 'CONFIRMEE':
            case 'PAYEE':
                return 'success';
            case 'EN_ATTENTE':
                return 'warn';
            case 'ANNULEE':
                return 'danger';
            case 'UTILISEE':
            case 'TERMINEE':
                return 'info';
            default:
                return 'secondary';
        }
    }

    formatHeure(heure?: string | number[]): string {
        if (!heure) return '--:--';
        if (Array.isArray(heure)) {
            const [h, m] = heure;
            return `${String(h).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
        }
        return heure.substring(0, 5);
    }

    formatGNF(montant?: number): string {
        if (montant == null) return '-';
        return new Intl.NumberFormat('fr-FR').format(montant) + ' GNF';
    }

    qrValeur(billet: { qrCodeData?: string; codeBillet?: string }): string {
        return billet.qrCodeData || billet.codeBillet || '';
    }
}
