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
            <a class="layout-topbar-logo" routerLink="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
                <div class="layout-topbar-logo-full" style="display:flex;align-items:center;gap:10px;">
                    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ea580c);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                        </svg>
                    </div>
                    <div style="display:flex;flex-direction:column;line-height:1.2;">
                        <span style="font-size:16px;font-weight:700;color:var(--topbar-item-text-color);">Billetterie<span style="color:#f97316;">GN</span></span>
                        <span style="font-size:9px;font-weight:500;letter-spacing:0.05em;opacity:0.6;color:var(--topbar-item-text-color);">TRANSPORT GUINEE</span>
                    </div>
                </div>
                <div class="layout-topbar-logo-slim" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ea580c);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                    </svg>
                </div>
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
