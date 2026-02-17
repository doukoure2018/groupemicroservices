import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

import { OffreService } from '@/service/offre.service';
import { VehiculeService } from '@/service/vehicule.service';
import { PartenaireService } from '@/service/partenaire.service';
import { TrajetService } from '@/service/trajet.service';
import { OffreStats, Offre, getStatutOffreSeverity, getStatutOffreLabel, formatHeureOffre, formatMontantOffre, formatDateOffre, getTauxRemplissage } from '@/interface/offre.model';
import { TrajetStats } from '@/interface/trajet.model';
import { Vehicule, getStatutVehiculeSeverity, getStatutVehiculeLabel } from '@/interface/vehicule.model';
import { Partenaire, getTypePartenaireLabel } from '@/interface/partenaire.model';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, TableModule, ChartModule, SkeletonModule, TooltipModule],
    templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
    private offreService = inject(OffreService);
    private vehiculeService = inject(VehiculeService);
    private partenaireService = inject(PartenaireService);
    private trajetService = inject(TrajetService);
    private router = inject(Router);

    loading = signal(true);

    // KPI data
    offreStats = signal<OffreStats>({ total: 0, enAttente: 0, ouvertes: 0, fermees: 0, enCours: 0, terminees: 0, annulees: 0, suspendues: 0, aujourd_hui: 0 });
    vehiculeStats = signal<{ total: number; actifs: number; inactifs: number; enMaintenance: number; suspendus: number }>({ total: 0, actifs: 0, inactifs: 0, enMaintenance: 0, suspendus: 0 });
    partenaireStats = signal<{ total: number; actifs: number; inactifs: number; suspendus: number; enAttente: number }>({ total: 0, actifs: 0, inactifs: 0, suspendus: 0, enAttente: 0 });
    trajetStats = signal<TrajetStats>({ total: 0, actifs: 0, inactifs: 0 });

    // Table data
    offresAujourdHui = signal<Offre[]>([]);
    vehiculesAlerte = signal<Vehicule[]>([]);
    partenairesEnAttente = signal<Partenaire[]>([]);

    // Charts
    offreChartData = signal<any>(null);
    offreChartOptions = signal<any>(null);
    partenaireChartData = signal<any>(null);
    partenaireChartOptions = signal<any>(null);

    // Helper functions exposed to template
    getStatutOffreSeverity = getStatutOffreSeverity;
    getStatutOffreLabel = getStatutOffreLabel;
    formatHeureOffre = formatHeureOffre;
    formatMontantOffre = formatMontantOffre;
    formatDateOffre = formatDateOffre;
    getTauxRemplissage = getTauxRemplissage;
    getStatutVehiculeSeverity = getStatutVehiculeSeverity;
    getStatutVehiculeLabel = getStatutVehiculeLabel;
    getTypePartenaireLabel = getTypePartenaireLabel;

    ngOnInit(): void {
        this.loadDashboardData();
    }

    private loadDashboardData(): void {
        this.loading.set(true);

        forkJoin({
            offreStats: this.offreService.getStats(),
            vehiculeStats: this.vehiculeService.getStats(),
            partenaireStats: this.partenaireService.getStats(),
            trajetStats: this.trajetService.getStats(),
            offresAujourdHui: this.offreService.getAujourdHui(),
            assuranceExpiree: this.vehiculeService.getAssuranceExpiree(),
            visiteExpiree: this.vehiculeService.getVisiteExpiree(),
            partenairesEnAttente: this.partenaireService.getByStatut('EN_ATTENTE'),
            partenaireStatsByType: this.partenaireService.getStatsByType()
        }).subscribe({
            next: (results) => {
                this.offreStats.set(results.offreStats);
                this.vehiculeStats.set(results.vehiculeStats);
                this.partenaireStats.set(results.partenaireStats);
                this.trajetStats.set(results.trajetStats);
                this.offresAujourdHui.set(results.offresAujourdHui);
                this.partenairesEnAttente.set(results.partenairesEnAttente);

                // Merge vehicle alerts (deduplicate by uuid)
                const alertMap = new Map<string, Vehicule & { alertType: string }>();
                results.assuranceExpiree.forEach((v: Vehicule) => alertMap.set(v.vehiculeUuid!, { ...v, alertType: 'Assurance expirée' }));
                results.visiteExpiree.forEach((v: Vehicule) => {
                    if (alertMap.has(v.vehiculeUuid!)) {
                        alertMap.get(v.vehiculeUuid!)!.alertType = 'Assurance + Visite expirées';
                    } else {
                        alertMap.set(v.vehiculeUuid!, { ...v, alertType: 'Visite technique expirée' });
                    }
                });
                this.vehiculesAlerte.set(Array.from(alertMap.values()));

                this.buildOffreChart(results.offreStats);
                this.buildPartenaireChart(results.partenaireStatsByType);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Dashboard load error:', err);
                this.loading.set(false);
            }
        });
    }

    private buildOffreChart(stats: OffreStats): void {
        this.offreChartData.set({
            labels: ['Ouvertes', 'En attente', 'En cours', 'Terminées', 'Fermées', 'Annulées', 'Suspendues'],
            datasets: [
                {
                    data: [stats.ouvertes, stats.enAttente, stats.enCours, stats.terminees, stats.fermees, stats.annulees, stats.suspendues],
                    backgroundColor: ['#22C55E', '#F97316', '#3B82F6', '#6366F1', '#64748B', '#EF4444', '#EAB308'],
                    borderWidth: 0,
                    hoverOffset: 8
                }
            ]
        });

        this.offreChartOptions.set({
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 16, font: { size: 12 } }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        });
    }

    private buildPartenaireChart(statsByType: any): void {
        const typeLabels: Record<string, string> = {
            AGENCE: 'Agences',
            MICROFINANCE: 'Microfinance',
            COMMERCE: 'Commerces',
            POINT_VENTE: 'Points de vente',
            TRANSPORTEUR: 'Transporteurs',
            REVENDEUR: 'Revendeurs',
            GUICHET: 'Guichets',
            AUTRE: 'Autres'
        };

        const labels: string[] = [];
        const data: number[] = [];
        const colors = ['#F97316', '#3B82F6', '#22C55E', '#6366F1', '#EAB308', '#EC4899', '#14B8A6', '#64748B'];

        if (statsByType) {
            let i = 0;
            for (const [key, value] of Object.entries(statsByType)) {
                if (typeof value === 'number' && value > 0) {
                    labels.push(typeLabels[key] || key);
                    data.push(value);
                    i++;
                }
            }
        }

        this.partenaireChartData.set({
            labels,
            datasets: [
                {
                    label: 'Partenaires',
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderRadius: 6,
                    maxBarThickness: 40
                }
            ]
        });

        this.partenaireChartOptions.set({
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        });
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }
}
