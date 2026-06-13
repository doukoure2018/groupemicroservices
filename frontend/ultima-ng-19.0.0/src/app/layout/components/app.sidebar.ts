import { Component, computed, ElementRef, inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { AppMenu } from './app.menu';
import { AppMenuProfile } from '@/layout/components/app.menuprofile';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@/layout/service/layout.service';
import { IUser } from '@/interface/user';

@Component({
    selector: '[app-sidebar]',
    standalone: true,
    imports: [AppMenuProfile, AppMenu, CommonModule],
    template: `<div class="layout-sidebar" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
        <div class="layout-sidebar-top">
            <a href="/" style="display:flex;align-items:center;text-decoration:none;">
                <!-- Logo SIRA Guinée — affiché identique en full et slim mode (pas d'icône séparée). -->
                <img src="/images/logo-sira-navbar.png" alt="SIRA Guinée — Transport & Immobilier" style="height:36px;width:auto;display:block;" />
            </a>
            <button class="layout-sidebar-anchor" type="button" (click)="anchor()"></button>
        </div>
        <div app-menu-profile #menuProfileStart *ngIf="menuProfilePosition() === 'start'" [user]="user"></div>
        <div #menuContainer class="layout-menu-container">
            <div app-menu [user]="user"></div>
        </div>
        <div app-menu-profile #menuProfileEnd *ngIf="menuProfilePosition() === 'end'" [user]="user"></div>
    </div>`
})
export class AppSidebar implements OnDestroy {
    @Input() user?: IUser;

    el = inject(ElementRef);

    layoutService = inject(LayoutService);

    @ViewChild(AppMenu) appMenu!: AppMenu;

    @ViewChild('menuProfileStart') menuProfileStart!: AppMenuProfile;

    @ViewChild('menuProfileEnd') menuProfileEnd!: AppMenuProfile;

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    overlayMenuActive = computed(() => this.layoutService.layoutState().overlayMenuActive);

    menuProfilePosition = computed(() => this.layoutService.layoutConfig().menuProfilePosition);

    anchored = computed(() => this.layoutService.layoutState().anchored);

    timeout: any;

    resetOverlay() {
        if (this.overlayMenuActive()) {
            this.layoutService.layoutState.update((val) => ({ ...val, overlayMenuActive: false }));
        }
    }

    onMouseEnter() {
        if (!this.anchored()) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            this.layoutService.layoutState.update((val) => ({ ...val, sidebarActive: true }));
        }
    }

    onMouseLeave() {
        if (!this.anchored()) {
            if (!this.timeout) {
                this.timeout = setTimeout(() => this.layoutService.layoutState.update((val) => ({ ...val, sidebarActive: false })), 300);
            }
        }
    }

    anchor() {
        this.layoutService.layoutState.update((val) => ({ ...val, anchored: !val.anchored }));
    }

    ngOnDestroy() {
        this.resetOverlay();
    }
}
