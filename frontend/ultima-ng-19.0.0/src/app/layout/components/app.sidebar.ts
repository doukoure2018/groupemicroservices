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
            <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
                <div class="layout-sidebar-logo" style="display:flex;align-items:center;gap:10px;">
                    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ea580c);flex-shrink:0;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                        </svg>
                    </div>
                    <div style="display:flex;flex-direction:column;line-height:1.2;">
                        <span style="font-size:16px;font-weight:700;color:var(--topbar-item-text-color);">Billetterie<span style="color:#f97316;">GN</span></span>
                        <span style="font-size:9px;font-weight:500;letter-spacing:0.05em;opacity:0.6;color:var(--topbar-item-text-color);">TRANSPORT GUINEE</span>
                    </div>
                </div>
                <div class="layout-sidebar-logo-slim" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ea580c);flex-shrink:0;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
                    </svg>
                </div>
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
