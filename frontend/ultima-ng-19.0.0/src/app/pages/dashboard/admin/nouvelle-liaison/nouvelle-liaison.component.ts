import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

// Services
import { VilleService } from '@/service/ville.service';
import { SiteService } from '@/service/site.service';
import { LocalisationService } from '@/service/localisation.service';
import { DepartService } from '@/service/depart.service';
import { ArriveeService } from '@/service/arrivee.service';
import { TrajetService } from '@/service/trajet.service';
import { OffreService } from '@/service/offre.service';
import { VehiculeService } from '@/service/vehicule.service';

// Models
import { IVille } from '@/interface/ville';
import { Site, TYPE_SITES } from '@/interface/site.model';
import { Depart } from '@/interface/depart.model';
import { Arrivee } from '@/interface/arrivee.model';
import { Trajet, DEVISES } from '@/interface/trajet.model';
import { Offre } from '@/interface/offre.model';
import { Vehicule } from '@/interface/vehicule.model';
import { IResponse } from '@/interface/response';

/** Étape de la chaîne de création exécutée à la fin du wizard. */
interface EtapeExecution {
    label: string;
    statut: 'attente' | 'en_cours' | 'fait' | 'reutilise' | 'erreur' | 'ignore';
    detail?: string;
}

/** Sélection d'un site : existant ou à créer. */
interface ChoixSite {
    villeUuid: string;
    mode: 'existant' | 'nouveau';
    siteUuid: string;
    nouveauNom: string;
    nouveauType: string;
    nouvelleAdresse: string;
}

@Component({
    selector: 'app-nouvelle-liaison',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, CardModule, DropdownModule, InputTextModule, InputNumberModule, SelectButtonModule, CheckboxModule, ToastModule, TagModule, DividerModule],
    providers: [MessageService],
    templateUrl: './nouvelle-liaison.component.html',
    styleUrl: './nouvelle-liaison.component.scss'
})
export class NouvelleLiaisonComponent implements OnInit {
    private readonly villeService = inject(VilleService);
    private readonly siteService = inject(SiteService);
    private readonly localisationService = inject(LocalisationService);
    private readonly departService = inject(DepartService);
    private readonly arriveeService = inject(ArriveeService);
    private readonly trajetService = inject(TrajetService);
    private readonly offreService = inject(OffreService);
    private readonly vehiculeService = inject(VehiculeService);
    private readonly messageService = inject(MessageService);

    // ===== Référentiels =====
    villes = signal<IVille[]>([]);
    vehicules = signal<Vehicule[]>([]);
    sitesVilleDepart = signal<Site[]>([]);
    sitesVilleArrivee = signal<Site[]>([]);

    typeSites = TYPE_SITES;
    devises = DEVISES;
    modesSite = [
        { label: 'Site existant', value: 'existant' },
        { label: 'Créer un site', value: 'nouveau' }
    ];

    // ===== Navigation =====
    readonly etapes = ['Départ', 'Arrivée', 'Trajet', 'Offre', 'Récapitulatif'];
    currentStep = signal(1);

    // ===== Saisie (ngModel) =====
    depart: ChoixSite = { villeUuid: '', mode: 'existant', siteUuid: '', nouveauNom: '', nouveauType: 'GARE_ROUTIERE', nouvelleAdresse: '' };
    arrivee: ChoixSite = { villeUuid: '', mode: 'existant', siteUuid: '', nouveauNom: '', nouveauType: 'GARE_ROUTIERE', nouvelleAdresse: '' };
    trajet = { libelleTrajet: '', dureeEstimeeMinutes: null as number | null, distanceKm: null as number | null, montantBase: null as number | null, montantBagages: null as number | null, devise: 'GNF' };
    offre = { creerOffre: false, vehiculeUuid: '', dateDepart: '', heureDepart: '', nombrePlacesTotal: null as number | null, montant: null as number | null };

    // ===== Exécution =====
    execution = signal<EtapeExecution[]>([]);
    enCours = signal(false);
    termine = signal(false);
    trajetCree = signal<Trajet | null>(null);
    offreCreee = signal<Offre | null>(null);

    ngOnInit(): void {
        this.villeService.getActiveVilles$().subscribe({
            next: (response: IResponse) => this.villes.set(response.data?.villes || []),
            error: (err) => this.showError(err, 'Impossible de charger les villes')
        });
        this.vehiculeService.getAll().subscribe({
            next: (data) => this.vehicules.set(data),
            error: (err) => this.showError(err, 'Impossible de charger les véhicules')
        });
    }

    // ===== Chargement des sites par ville =====
    onVilleDepartChange(): void {
        this.depart.siteUuid = '';
        this.sitesVilleDepart.set([]);
        if (!this.depart.villeUuid) return;
        this.siteService.getByVille(this.depart.villeUuid).subscribe({
            next: (data) => {
                this.sitesVilleDepart.set(data);
                // Aucun site dans cette ville → basculer en création
                if (data.length === 0) this.depart.mode = 'nouveau';
            },
            error: (err) => this.showError(err, 'Impossible de charger les sites de la ville')
        });
    }

    onVilleArriveeChange(): void {
        this.arrivee.siteUuid = '';
        this.sitesVilleArrivee.set([]);
        if (!this.arrivee.villeUuid) return;
        this.siteService.getByVille(this.arrivee.villeUuid).subscribe({
            next: (data) => {
                this.sitesVilleArrivee.set(data);
                if (data.length === 0) this.arrivee.mode = 'nouveau';
            },
            error: (err) => this.showError(err, 'Impossible de charger les sites de la ville')
        });
    }

    onVehiculeChange(): void {
        const vehicule = this.vehicules().find((v) => v.vehiculeUuid === this.offre.vehiculeUuid);
        if (vehicule?.nombrePlaces && !this.offre.nombrePlacesTotal) {
            this.offre.nombrePlacesTotal = vehicule.nombrePlaces;
        }
        if (this.trajet.montantBase && !this.offre.montant) {
            this.offre.montant = this.trajet.montantBase;
        }
    }

    // ===== Validation par étape =====
    private choixSiteValide(choix: ChoixSite): boolean {
        if (!choix.villeUuid) return false;
        if (choix.mode === 'existant') return !!choix.siteUuid;
        return choix.nouveauNom.trim().length >= 2 && choix.nouvelleAdresse.trim().length >= 5;
    }

    etape1Valide = (): boolean => this.choixSiteValide(this.depart);

    etape2Valide = (): boolean => {
        if (!this.choixSiteValide(this.arrivee)) return false;
        // Le site d'arrivée doit être différent du site de départ
        if (this.depart.mode === 'existant' && this.arrivee.mode === 'existant' && this.depart.siteUuid === this.arrivee.siteUuid) return false;
        return true;
    };

    etape3Valide = (): boolean => !!this.trajet.libelleTrajet.trim() && (this.trajet.dureeEstimeeMinutes ?? 0) > 0 && (this.trajet.montantBase ?? 0) > 0;

    etape4Valide = (): boolean => {
        if (!this.offre.creerOffre) return true;
        return !!this.offre.vehiculeUuid && !!this.offre.dateDepart && !!this.offre.heureDepart && (this.offre.nombrePlacesTotal ?? 0) > 0 && (this.offre.montant ?? 0) > 0;
    };

    etapeCouranteValide(): boolean {
        switch (this.currentStep()) {
            case 1: return this.etape1Valide();
            case 2: return this.etape2Valide();
            case 3: return this.etape3Valide();
            case 4: return this.etape4Valide();
            default: return true;
        }
    }

    memeSiteDetecte = computed(() => this.depart.mode === 'existant' && this.arrivee.mode === 'existant' && !!this.depart.siteUuid && this.depart.siteUuid === this.arrivee.siteUuid);

    // ===== Libellés d'affichage =====
    villeLibelle(villeUuid: string): string {
        return this.villes().find((v) => v.villeUuid === villeUuid)?.libelle || '';
    }

    nomSiteDepart(): string {
        if (this.depart.mode === 'nouveau') return this.depart.nouveauNom.trim();
        return this.sitesVilleDepart().find((s) => s.siteUuid === this.depart.siteUuid)?.nom || '';
    }

    nomSiteArrivee(): string {
        if (this.arrivee.mode === 'nouveau') return this.arrivee.nouveauNom.trim();
        return this.sitesVilleArrivee().find((s) => s.siteUuid === this.arrivee.siteUuid)?.nom || '';
    }

    vehiculeLibelle(): string {
        const v = this.vehicules().find((x) => x.vehiculeUuid === this.offre.vehiculeUuid);
        return v ? `${v.immatriculation} — ${v.marque || ''} (${v.nombrePlaces} places)` : '';
    }

    getVehiculeOptions(): { label: string; value: string }[] {
        return this.vehicules().map((v) => ({
            label: `${v.immatriculation} — ${v.marque || ''} ${v.modele || ''} (${v.nombrePlaces} places)`,
            value: v.vehiculeUuid!
        }));
    }

    // ===== Navigation =====
    suivant(): void {
        if (!this.etapeCouranteValide()) return;
        // Pré-remplir le libellé du trajet en arrivant sur l'étape 3
        if (this.currentStep() === 2 && !this.trajet.libelleTrajet) {
            this.trajet.libelleTrajet = `${this.villeLibelle(this.depart.villeUuid)} → ${this.villeLibelle(this.arrivee.villeUuid)}`;
        }
        this.currentStep.update((s) => Math.min(s + 1, this.etapes.length));
    }

    precedent(): void {
        this.currentStep.update((s) => Math.max(s - 1, 1));
    }

    allerA(step: number): void {
        // Navigation libre uniquement vers les étapes déjà atteintes (en arrière)
        if (step < this.currentStep() && !this.enCours() && !this.termine()) {
            this.currentStep.set(step);
        }
    }

    // ===== Exécution de la chaîne =====
    async creerLiaison(): Promise<void> {
        if (this.enCours() || this.termine()) return;

        const plan: EtapeExecution[] = [
            { label: this.depart.mode === 'nouveau' ? `Créer le site de départ « ${this.nomSiteDepart()} »` : `Site de départ « ${this.nomSiteDepart()} »`, statut: 'attente' },
            { label: this.arrivee.mode === 'nouveau' ? `Créer le site d'arrivée « ${this.nomSiteArrivee()} »` : `Site d'arrivée « ${this.nomSiteArrivee()} »`, statut: 'attente' },
            { label: 'Point de départ', statut: 'attente' },
            { label: "Point d'arrivée", statut: 'attente' },
            { label: `Trajet « ${this.trajet.libelleTrajet} »`, statut: 'attente' },
            { label: this.offre.creerOffre ? `Offre du ${this.offre.dateDepart} à ${this.offre.heureDepart}` : 'Offre (non demandée)', statut: this.offre.creerOffre ? 'attente' : 'ignore' }
        ];
        this.execution.set(plan);
        this.enCours.set(true);

        const maj = (index: number, statut: EtapeExecution['statut'], detail?: string) => {
            this.execution.update((list) => list.map((e, i) => (i === index ? { ...e, statut, detail } : e)));
        };

        try {
            // 1. Site de départ
            maj(0, 'en_cours');
            const siteDepart = await this.resoudreSite(this.depart, this.sitesVilleDepart());
            maj(0, this.depart.mode === 'nouveau' ? 'fait' : 'reutilise', siteDepart.villeLibelle);

            // 2. Site d'arrivée
            maj(1, 'en_cours');
            const siteArrivee = await this.resoudreSite(this.arrivee, this.sitesVilleArrivee());
            maj(1, this.arrivee.mode === 'nouveau' ? 'fait' : 'reutilise', siteArrivee.villeLibelle);

            if (siteDepart.siteUuid === siteArrivee.siteUuid) {
                throw "Le site d'arrivée doit être différent du site de départ";
            }

            // 3. Point de départ (réutilisé si un départ du même libellé existe sur ce site)
            maj(2, 'en_cours');
            const departsExistants = await firstValueFrom(this.departService.getBySiteActifs(siteDepart.siteUuid!));
            let pointDepart: Depart | undefined = departsExistants.find((d) => d.libelle.trim().toLowerCase() === siteDepart.nom.trim().toLowerCase());
            if (pointDepart) {
                maj(2, 'reutilise', pointDepart.libelle);
            } else {
                pointDepart = await firstValueFrom(this.departService.create({ siteUuid: siteDepart.siteUuid!, libelle: siteDepart.nom, actif: true }));
                maj(2, 'fait', pointDepart.libelle);
            }

            // 4. Point d'arrivée (réutilisé si ce départ dessert déjà ce site)
            maj(3, 'en_cours');
            const arriveesExistantes = await firstValueFrom(this.arriveeService.getByDepart(pointDepart.departUuid!));
            let pointArrivee: Arrivee | undefined = arriveesExistantes.find((a) => a.siteUuid === siteArrivee.siteUuid);
            if (pointArrivee) {
                maj(3, 'reutilise', pointArrivee.libelle);
            } else {
                pointArrivee = await firstValueFrom(
                    this.arriveeService.create({
                        siteUuid: siteArrivee.siteUuid!,
                        departUuid: pointDepart.departUuid!,
                        libelle: siteArrivee.nom,
                        libelleDepart: pointDepart.libelle,
                        actif: true
                    })
                );
                maj(3, 'fait', pointArrivee.libelle);
            }

            // 5. Trajet
            maj(4, 'en_cours');
            const trajetCree = await firstValueFrom(
                this.trajetService.create({
                    departUuid: pointDepart.departUuid!,
                    arriveeUuid: pointArrivee.arriveeUuid!,
                    libelleTrajet: this.trajet.libelleTrajet.trim(),
                    dureeEstimeeMinutes: this.trajet.dureeEstimeeMinutes!,
                    distanceKm: this.trajet.distanceKm ?? undefined,
                    montantBase: this.trajet.montantBase!,
                    montantBagages: this.trajet.montantBagages ?? undefined,
                    devise: this.trajet.devise,
                    actif: true
                })
            );
            this.trajetCree.set(trajetCree);
            maj(4, 'fait', trajetCree.libelleTrajet);

            // 6. Offre (optionnelle)
            if (this.offre.creerOffre) {
                maj(5, 'en_cours');
                const offreCreee = await firstValueFrom(
                    this.offreService.create({
                        trajetUuid: trajetCree.trajetUuid!,
                        vehiculeUuid: this.offre.vehiculeUuid,
                        dateDepart: this.offre.dateDepart,
                        heureDepart: this.offre.heureDepart,
                        nombrePlacesTotal: this.offre.nombrePlacesTotal!,
                        montant: this.offre.montant!,
                        devise: this.trajet.devise
                    })
                );
                this.offreCreee.set(offreCreee);
                maj(5, 'fait');
            }

            this.termine.set(true);
            this.messageService.add({ severity: 'success', summary: 'Liaison créée', detail: `${this.trajet.libelleTrajet} est prête`, life: 5000 });
        } catch (err) {
            const message = typeof err === 'string' ? err : 'Une erreur est survenue';
            // Marquer l'étape en cours comme en erreur ; les objets déjà créés restent
            // (référentiels réutilisables — relancer le wizard les retrouvera)
            this.execution.update((list) => list.map((e) => (e.statut === 'en_cours' ? { ...e, statut: 'erreur', detail: message } : e)));
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: message, life: 7000 });
        } finally {
            this.enCours.set(false);
        }
    }

    /** Retourne le site choisi, en le créant (localisation + site) si nécessaire. */
    private async resoudreSite(choix: ChoixSite, sitesDeLaVille: Site[]): Promise<Site> {
        if (choix.mode === 'existant') {
            const site = sitesDeLaVille.find((s) => s.siteUuid === choix.siteUuid);
            if (!site) throw 'Site introuvable, rechargez la page';
            return site;
        }
        // Localisation minimale (sans quartier — la ville directe du site suffit depuis V35)
        const locResponse = await firstValueFrom(
            this.localisationService.createLocalisation$({
                quartierUuid: null,
                adresseComplete: choix.nouvelleAdresse.trim(),
                description: `Créée via l'assistant Nouvelle liaison`
            })
        );
        const localisationUuid = locResponse.data?.localisation?.localisationUuid;
        if (!localisationUuid) throw 'La création de la localisation a échoué';

        return await firstValueFrom(
            this.siteService.create({
                localisationUuid,
                villeUuid: choix.villeUuid,
                nom: choix.nouveauNom.trim(),
                typeSite: choix.nouveauType,
                actif: true
            })
        );
    }

    recommencer(): void {
        this.depart = { villeUuid: '', mode: 'existant', siteUuid: '', nouveauNom: '', nouveauType: 'GARE_ROUTIERE', nouvelleAdresse: '' };
        this.arrivee = { villeUuid: '', mode: 'existant', siteUuid: '', nouveauNom: '', nouveauType: 'GARE_ROUTIERE', nouvelleAdresse: '' };
        this.trajet = { libelleTrajet: '', dureeEstimeeMinutes: null, distanceKm: null, montantBase: null, montantBagages: null, devise: 'GNF' };
        this.offre = { creerOffre: false, vehiculeUuid: '', dateDepart: '', heureDepart: '', nombrePlacesTotal: null, montant: null };
        this.sitesVilleDepart.set([]);
        this.sitesVilleArrivee.set([]);
        this.execution.set([]);
        this.termine.set(false);
        this.trajetCree.set(null);
        this.offreCreee.set(null);
        this.currentStep.set(1);
    }

    executionEnErreur(): boolean {
        return this.execution().some((e) => e.statut === 'erreur');
    }

    getStatutIcon(statut: EtapeExecution['statut']): string {
        switch (statut) {
            case 'fait': return 'pi pi-check-circle';
            case 'reutilise': return 'pi pi-replay';
            case 'en_cours': return 'pi pi-spin pi-spinner';
            case 'erreur': return 'pi pi-times-circle';
            case 'ignore': return 'pi pi-minus-circle';
            default: return 'pi pi-circle';
        }
    }

    getStatutLabel(statut: EtapeExecution['statut']): string {
        switch (statut) {
            case 'fait': return 'Créé';
            case 'reutilise': return 'Réutilisé';
            case 'en_cours': return 'En cours…';
            case 'erreur': return 'Erreur';
            case 'ignore': return 'Ignorée';
            default: return 'En attente';
        }
    }

    // Les services transforment les erreurs HTTP en string (handleError) avant de les relancer.
    private showError(err: unknown, fallback: string): void {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: typeof err === 'string' && err ? err : fallback, life: 5000 });
    }
}
