import { Component, ElementRef, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { IUser } from '@/interface/user';

@Component({
    selector: 'app-menu, [app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: ` <ul class="layout-menu" #menuContainer>
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul>`
})
export class AppMenu {
    @Input() user?: IUser;
    el: ElementRef = inject(ElementRef);

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model: MenuItem[] = [];

    ngOnInit() {
        this.initializeMenu();
    }

    private initializeMenu() {
        if (this.user?.role === 'SUPER_ADMIN') {
            this.model = this.getSuperAdminMenu();
        } else if (this.user?.role === 'AGENT_CREDIT') {
            this.model = this.getAgentCreditMenu();
        } else if (this.user?.role === 'MANAGER') {
            this.model = this.getManagerMenu();
        } else {
            this.model = this.getDefaultMenu();
        }
    }

    private getSuperAdminMenu(): MenuItem[] {
        return [
            {
                label: "ORDRE D'INSERTION",
                items: [
                    {
                        label: 'Tableau de bord',
                        icon: 'pi pi-fw pi-th-large',
                        routerLink: ['/dashboards']
                    }
                ]
            },
            {
                label: '1. Données Géographiques',
                icon: 'pi pi-fw pi-map',
                items: [
                    {
                        label: '1.1 Régions',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/dashboards/admin/regions']
                    },
                    {
                        label: '1.2 Villes/Préfectures',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/dashboards/admin/villes']
                    },
                    {
                        label: '1.3 Communes',
                        icon: 'pi pi-fw pi-map-marker',
                        routerLink: ['/dashboards/admin/communes']
                    },
                    {
                        label: '1.4 Quartiers',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/dashboards/admin/quartiers']
                    },
                    {
                        label: '1.5 Localisations',
                        icon: 'pi pi-fw pi-compass',
                        routerLink: ['/dashboards/admin/localisations']
                    }
                ]
            },
            {
                label: '2. Infrastructure Transport',
                icon: 'pi pi-fw pi-sitemap',
                items: [
                    {
                        label: '2.1 Sites/Gares',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/dashboards/admin/sites-gares']
                    },
                    {
                        label: '2.2 Points de Départ',
                        icon: 'pi pi-fw pi-sign-out',
                        routerLink: ['/dashboards/admin/points-depart']
                    },
                    {
                        label: "2.3 Points d'Arrivée",
                        icon: 'pi pi-fw pi-sign-in',
                        routerLink: ['/dashboards/admin/points-arrivee']
                    },
                    {
                        label: '2.4 Trajets',
                        icon: 'pi pi-fw pi-directions',
                        routerLink: ['/dashboards/admin/trajets']
                    }
                ]
            },
            {
                label: '3. Véhicules',
                icon: 'pi pi-fw pi-car',
                items: [
                    {
                        label: '3.1 Types de Véhicules',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/dashboards/admin/types-vehicules']
                    },
                    {
                        label: '3.2 Véhicules',
                        icon: 'pi pi-fw pi-car',
                        routerLink: ['/dashboards/admin/vehicules']
                    }
                ]
            },
            {
                label: '4. Configuration Commerciale',
                icon: 'pi pi-fw pi-cog',
                items: [
                    {
                        label: '4.1 Modes de Règlement',
                        icon: 'pi pi-fw pi-credit-card',
                        routerLink: ['/dashboards/admin/modes-reglement']
                    },
                    {
                        label: '4.2 Partenaires',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/dashboards/admin/partenaires']
                    }
                ]
            },
            {
                label: '5. Offres de Transport',
                icon: 'pi pi-fw pi-ticket',
                items: [
                    {
                        label: 'Création des Offres',
                        icon: 'pi pi-fw pi-plus-circle',
                        routerLink: ['/dashboards/admin/offres-transport']
                    }
                ]
            },
            {
                label: '6. Utilisateurs',
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: 'Liste des Utilisateurs',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/dashboards/admin/utilisateurs']
                    },
                    {
                        label: 'Créer un Utilisateur',
                        icon: 'pi pi-fw pi-user-plus',
                        routerLink: ['/dashboards/admin/utilisateurs/create']
                    }
                ]
            }
        ];
    }

    private getAgentCreditMenu(): MenuItem[] {
        return [
            {
                label: 'Tableau de Bord',
                icon: 'pi pi-home',
                items: [
                    {
                        label: 'Tableau de Bord',
                        icon: 'pi pi-fw pi-chart-pie',
                        routerLink: ['/dashboards']
                    },
                    {
                        label: 'Analyse de Credit',
                        icon: 'pi pi-fw pi-hourglass',
                        routerLink: ['/dashboards/credit']
                    }
                ]
            }
        ];
    }

    private getManagerMenu(): MenuItem[] {
        return [
            {
                label: 'Tableau de Bord',
                icon: 'pi pi-home',
                items: [
                    {
                        label: 'Tableau de Bord',
                        icon: 'pi pi-fw pi-chart-pie',
                        routerLink: ['/dashboards']
                    },
                    {
                        label: 'Rapports Manager',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/dashboards/manager']
                    }
                ]
            }
        ];
    }

    private getDefaultMenu(): MenuItem[] {
        return [
            {
                label: 'Tableau de Bord',
                icon: 'pi pi-home',
                items: [
                    {
                        label: 'Tableau de Bord',
                        icon: 'pi pi-fw pi-chart-pie',
                        routerLink: ['/dashboards']
                    }
                ]
            }
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['user']) {
            this.initializeMenu();
        }
    }
}
