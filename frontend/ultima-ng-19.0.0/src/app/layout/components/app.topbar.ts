import { Component, DestroyRef, ElementRef, inject, Input, OnInit, signal, SimpleChanges, ViewChild } from '@angular/core';
import { MegaMenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/layout/service/layout.service';
import { Ripple } from 'primeng/ripple';
import { InputText } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { MegaMenuModule } from 'primeng/megamenu';
import { BadgeModule } from 'primeng/badge';
import { IUser } from '@/interface/user';
import { UserService } from '@/service/user.service';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, FormsModule, Ripple, InputText, ButtonModule, MegaMenuModule, BadgeModule],
    template: `
        <div class="layout-topbar-start">
            <a class="layout-topbar-logo synergia-brand" routerLink="/" aria-label="SYNERGIA IMMO TRANS GUINEE">
                <!-- Lockup CSS aux couleurs de marque (vert forêt + or) : net à toute
                     taille, contrairement au PNG bannière trop dense en petit. -->
                <span class="synergia-emblem" aria-hidden="true">
                    <svg viewBox="0 0 40 40" width="40" height="40">
                        <circle cx="20" cy="20" r="19" fill="#0f3019" stroke="#f2a900" stroke-width="1.5" />
                        <!-- immeuble -->
                        <rect x="15.5" y="12" width="8.5" height="18" rx="0.6" fill="#f2a900" />
                        <rect x="17" y="14.5" width="1.6" height="1.6" fill="#0f3019" />
                        <rect x="20" y="14.5" width="1.6" height="1.6" fill="#0f3019" />
                        <rect x="17" y="17.5" width="1.6" height="1.6" fill="#0f3019" />
                        <rect x="20" y="17.5" width="1.6" height="1.6" fill="#0f3019" />
                        <rect x="17" y="20.5" width="1.6" height="1.6" fill="#0f3019" />
                        <rect x="20" y="20.5" width="1.6" height="1.6" fill="#0f3019" />
                        <!-- maison -->
                        <path d="M24 22 l4 -3 l4 3 v8 h-8 z" fill="#e59500" />
                        <rect x="26.6" y="25" width="2.8" height="2.8" fill="#0f3019" />
                        <!-- sol / champs -->
                        <path d="M7 30 q13 4 26 0 v1 q-13 4 -26 0 z" fill="#f2a900" />
                    </svg>
                </span>
                <span class="synergia-word">
                    <span class="synergia-name">SYNERGIA</span>
                    <span class="synergia-tag">IMMO · TRANS · GUINÉE</span>
                </span>
            </a>
            <a #menuButton class="layout-menu-button" (click)="onMenuButtonClick()">
                <i class="pi pi-chevron-right"></i>
            </a>

            <button class="app-config-button app-config-mobile-button" (click)="toggleConfigSidebar()">
                <i class="pi pi-cog"></i>
            </button>

            <a #mobileMenuButton class="layout-topbar-mobile-button" (click)="onTopbarMenuToggle()">
                <i class="pi pi-ellipsis-v"></i>
            </a>
        </div>

        <div class="layout-topbar-end">
            <div class="layout-topbar-actions-start">
                <!-- <p-megamenu [model]="model" styleClass="layout-megamenu" breakpoint="0px"></p-megamenu> -->
            </div>
            <div class="layout-topbar-actions-end">
                <ul class="layout-topbar-items">
                    <li class="layout-topbar-search">
                        <a pStyleClass="@next" enterFromClass="!hidden" enterActiveClass="animate-scalein" leaveToClass="!hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true" (click)="focusSearchInput()">
                            <i class="pi pi-search"></i>
                        </a>

                        <div class="layout-search-panel !hidden p-input-filled">
                            <i class="pi pi-search"></i>
                            <input #searchInput type="text" pInputText placeholder="Search" />
                            <button pButton pRipple type="button" icon="pi pi-times" rounded text pStyleClass=".layout-search-panel" leaveToClass="!hidden" leaveActiveClass="animate-fadeout"></button>
                        </div>
                    </li>
                    <li>
                        <button class="app-config-button" (click)="toggleConfigSidebar()">
                            <i class="pi pi-cog"></i>
                        </button>
                    </li>

                    <li>
                        <a pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                            <i class="pi pi-table"></i>
                        </a>
                    </li>
                    <li>
                        <a pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                            <img [src]="user?.imageUrl" [alt]="user?.firstName" class="w-8 h-8" />
                        </a>
                        <div class="hidden">
                            <ul class="list-none p-0 m-0">
                                @if (user?.role === 'SUPER_ADMIN') {
                                    <li>
                                        <a class="cursor-pointer flex items-center hover:bg-emphasis duration-150 transition-all px-4 py-2" pRipple>
                                            <i class="pi pi-cog mr-2"></i>
                                            <span>Setting</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a class="cursor-pointer flex items-center hover:bg-emphasis duration-150 transition-all px-4 py-2" pRipple>
                                            <i class="pi pi-file-o mr-2"></i>
                                            <span>Terms of Usage</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a class="cursor-pointer flex items-center hover:bg-emphasis duration-150 transition-all px-4 py-2" pRipple>
                                            <i class="pi pi-compass mr-2"></i>
                                            <span>Support</span>
                                        </a>
                                    </li>
                                }
                                <li>
                                    <a (click)="logout()" class="cursor-pointer flex items-center hover:bg-emphasis duration-150 transition-all px-4 py-2" pRipple>
                                        <i class="pi pi-power-off mr-2"></i>
                                        <span>Logout</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li>
                        <a (click)="onRightMenuButtonClick()">
                            <i class="pi pi-arrow-left"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    `,
    host: {
        class: 'layout-topbar'
    },
    styles: `
        :host ::ng-deep .p-overlaybadge .p-badge {
            outline-width: 0px;
        }

        /* --- Branding SYNERGIA : topbar vert forêt (couleurs du logo) --- */
        :host.layout-topbar {
            background: linear-gradient(135deg, #0f3019 0%, #16451f 60%, #1a4d24 100%);
            border-bottom: 2px solid #f2a900;
        }

        .synergia-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
        }
        .synergia-emblem {
            display: flex;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
        }
        .synergia-word {
            display: flex;
            flex-direction: column;
            line-height: 1;
        }
        .synergia-name {
            font-size: 1.35rem;
            font-weight: 800;
            letter-spacing: 2.5px;
            color: #ffffff;
        }
        .synergia-tag {
            margin-top: 3px;
            font-size: 0.55rem;
            font-weight: 600;
            letter-spacing: 2.5px;
            color: #f2a900;
        }
        /* Masque le wordmark en mode slim / petit écran, garde l'emblème */
        @media (max-width: 640px) {
            .synergia-word { display: none; }
        }

        /* Icônes et actions du topbar lisibles sur fond vert foncé */
        :host.layout-topbar ::ng-deep .layout-topbar-start > a i,
        :host.layout-topbar ::ng-deep .layout-topbar-end i,
        :host.layout-topbar ::ng-deep .layout-menu-button i,
        :host.layout-topbar ::ng-deep .app-config-button i,
        :host.layout-topbar ::ng-deep .layout-topbar-mobile-button i {
            color: rgba(255, 255, 255, 0.9);
        }
        :host.layout-topbar ::ng-deep .layout-topbar-start > a:hover i,
        :host.layout-topbar ::ng-deep .layout-topbar-end a:hover i {
            color: #f2a900;
        }
        :host.layout-topbar ::ng-deep .layout-menu-button {
            background: rgba(255, 255, 255, 0.12);
        }
    `
})
export class AppTopbar {
    @Input() user?: IUser;
    state = signal<{ loading: boolean; message: string | undefined; error: string | any }>({
        loading: false,
        message: undefined,
        error: undefined
    });
    private userService = inject(UserService);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    layoutService = inject(LayoutService);

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    @ViewChild('menuButton') menuButton!: ElementRef<HTMLButtonElement>;

    @ViewChild('mobileMenuButton') mobileMenuButton!: ElementRef<HTMLButtonElement>;

    model: MegaMenuItem[] = [
        {
            label: 'UI KIT',
            items: [
                [
                    {
                        label: 'UI KIT 1',
                        items: [
                            { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
                            { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
                            { label: 'Float Label', icon: 'pi pi-fw pi-bookmark', to: '/uikit/floatlabel' },
                            { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button' },
                            { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file' }
                        ]
                    }
                ],
                [
                    {
                        label: 'UI KIT 2',
                        items: [
                            { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
                            { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list' },
                            { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree' },
                            { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel' },
                            { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' }
                        ]
                    }
                ],
                [
                    {
                        label: 'UI KIT 3',
                        items: [
                            { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay' },
                            { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media' },
                            { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu' },
                            { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message' },
                            { label: 'Misc', icon: 'pi pi-fw pi-circle-off', to: '/uikit/misc' }
                        ]
                    }
                ]
            ]
        },
        {
            label: 'UTILITIES',
            items: [
                [
                    {
                        label: 'UTILITIES 1',
                        items: [
                            {
                                label: 'Buy Now',
                                icon: 'pi pi-fw pi-shopping-cart',
                                url: 'https://www.primefaces.org/store',
                                target: '_blank'
                            },
                            {
                                label: 'Documentation',
                                icon: 'pi pi-fw pi-info-circle',
                                to: '/documentation'
                            }
                        ]
                    }
                ]
            ]
        }
    ];

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    onRightMenuButtonClick() {
        this.layoutService.openRightMenu();
    }

    toggleConfigSidebar() {
        let layoutState = this.layoutService.layoutState();

        if (this.layoutService.isSidebarActive()) {
            layoutState.overlayMenuActive = false;
            layoutState.overlaySubmenuActive = false;
            layoutState.staticMenuMobileActive = false;
            layoutState.menuHoverActive = false;
            layoutState.configSidebarVisible = false;
        }
        layoutState.configSidebarVisible = !layoutState.configSidebarVisible;
        this.layoutService.layoutState.set({ ...layoutState });
    }

    focusSearchInput() {
        setTimeout(() => {
            this.searchInput.nativeElement.focus();
        }, 150);
    }

    onTopbarMenuToggle() {
        this.layoutService.layoutState.update((val) => ({ ...val, topbarMenuActive: !val.topbarMenuActive }));
    }

    public logout(): void {
        this.userService.logOut();
        this.router.navigate([``]);
    }
}
