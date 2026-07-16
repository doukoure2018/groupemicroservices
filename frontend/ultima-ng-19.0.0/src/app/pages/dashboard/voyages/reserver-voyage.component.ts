import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { OffreService } from '@/service/offre.service';
import { ModeReglementService } from '@/service/mode-reglement.service';
import { CommandeClientService } from '@/service/commande-client.service';
import { StorageService } from '@/service/storage.service';
import { Offre } from '@/interface/offre.model';
import { ModeReglement } from '@/interface/mode-reglement.model';
import { CommandeClient, PassagerRequest } from '@/interface/commande.model';

/**
 * Réservation d'un voyage côté web (Phase C) — même parcours que le mobile :
 * récap de l'offre → passagers → mode de règlement → commande → billets QR.
 * Point d'entrée : « Réserver » sur la home (redirection post-login).
 */
@Component({
    selector: 'app-reserver-voyage',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, QRCodeComponent, ButtonModule, CardModule, DropdownModule, InputTextModule, InputNumberModule, TagModule, DividerModule, ToastModule, ProgressSpinnerModule],
    providers: [MessageService],
    templateUrl: './reserver-voyage.component.html',
    styleUrl: './voyages.scss'
})
export class ReserverVoyageComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly offreService = inject(OffreService);
    private readonly modeReglementService = inject(ModeReglementService);
    private readonly commandeService = inject(CommandeClientService);
    private readonly messageService = inject(MessageService);
    private readonly storage = inject(StorageService);

    offre = signal<Offre | null>(null);
    modesReglement = signal<ModeReglement[]>([]);
    chargement = signal(true);
    erreurChargement = signal<string | null>(null);

    nombrePlaces = signal(1);
    passagers: PassagerRequest[] = [{ nom: '', prenom: '', telephone: '', pieceIdentite: '' }];
    modeReglementCode = '';

    envoiEnCours = signal(false);
    commandeCreee = signal<CommandeClient | null>(null);

    prixUnitaire = computed(() => {
        const o = this.offre();
        if (!o) return 0;
        return o.montantPromotion && o.montantPromotion > 0 && o.montantPromotion < (o.montant ?? 0) ? o.montantPromotion : (o.montant ?? 0);
    });

    montantTotal = computed(() => this.prixUnitaire() * this.nombrePlaces());

    maxPlaces = computed(() => Math.max(1, Math.min(this.offre()?.nombrePlacesDisponibles ?? 1, 8)));

    ngOnInit(): void {
        // Consommer l'URL de redirection posée par la home (« Se connecter pour
        // réserver ») pour ne pas re-atterrir ici aux prochains logins.
        this.storage.removeRedirectUrl();

        const offreUuid = this.route.snapshot.paramMap.get('offreUuid');
        if (!offreUuid) {
            this.erreurChargement.set('Offre introuvable.');
            this.chargement.set(false);
            return;
        }
        this.offreService.getByUuid(offreUuid).subscribe({
            next: (offre) => {
                this.offre.set(offre);
                this.chargement.set(false);
            },
            error: (err) => {
                this.erreurChargement.set(typeof err === 'string' ? err : "Impossible de charger l'offre.");
                this.chargement.set(false);
            }
        });
        this.modeReglementService.getAllActifs().subscribe({
            next: (modes) => {
                this.modesReglement.set(modes);
                if (modes.length > 0) this.modeReglementCode = modes[0].code || '';
            },
            error: () => this.modesReglement.set([])
        });
    }

    onNombrePlacesChange(n: number | null): void {
        const nombre = Math.max(1, Math.min(n ?? 1, this.maxPlaces()));
        this.nombrePlaces.set(nombre);
        while (this.passagers.length < nombre) {
            this.passagers.push({ nom: '', prenom: '', telephone: '', pieceIdentite: '' });
        }
        this.passagers.length = nombre;
    }

    formulaireValide(): boolean {
        if (!this.modeReglementCode) return false;
        return this.passagers.every((p) => p.nom.trim().length >= 2 && p.prenom.trim().length >= 2 && p.telephone.trim().length >= 8);
    }

    reserver(): void {
        const offre = this.offre();
        if (!offre || !this.formulaireValide() || this.envoiEnCours()) return;

        this.envoiEnCours.set(true);
        this.commandeService
            .creer({
                offreUuid: offre.offreUuid!,
                passagers: this.passagers.map((p) => ({
                    nom: p.nom.trim(),
                    prenom: p.prenom.trim(),
                    telephone: p.telephone.trim(),
                    pieceIdentite: p.pieceIdentite?.trim() || undefined
                })),
                modeReglementCode: this.modeReglementCode,
                montantTotal: this.montantTotal()
            })
            .subscribe({
                next: (commande) => {
                    this.envoiEnCours.set(false);
                    this.commandeCreee.set(commande);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                error: (err) => {
                    this.envoiEnCours.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Réservation impossible',
                        detail: typeof err === 'string' ? err : 'Une erreur est survenue',
                        life: 6000
                    });
                }
            });
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
