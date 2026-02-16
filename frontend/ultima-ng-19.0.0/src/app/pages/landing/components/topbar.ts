import { Component } from '@angular/core';
import { StyleClassModule } from 'primeng/styleclass';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { loginUrl } from '@/utils/fileutils';

@Component({
    selector: 'topbar',
    standalone: true,
    imports: [RouterModule, StyleClassModule, ButtonModule, RippleModule],
    template: `
    <header style="height: 72px; backdrop-filter: blur(20px)" class="flex justify-between items-center z-50 px-4 sm:px-8 bg-surface-950/80 top-0 w-full fixed border-b border-white/10">
        <a href="/" class="flex items-center gap-3">
            <img [attr.draggable]="false" src="/layout/images/logo/logo.png" alt="Billetterie GN" class="h-9" />
            <span class="text-white font-bold text-lg hidden sm:inline">Billetterie<span class="text-orange-400">GN</span></span>
        </a>

        <a class="cursor-pointer block lg:hidden text-white" pStyleClass="@next" enterFromClass="hidden" leaveToClass="hidden" [hideOnOutsideClick]="true">
            <i class="pi pi-bars !text-2xl"></i>
        </a>

        <nav id="menu" class="items-center grow hidden lg:flex absolute lg:static w-full lg:px-0 z-50 shadow-lg lg:shadow-none animate-fadein bg-surface-900 lg:!bg-transparent rounded-b-xl lg:rounded-none" style="top: 72px; left: 0">
            <ul class="list-none p-4 lg:p-0 m-0 ml-auto flex lg:items-center select-none flex-col lg:flex-row gap-1 lg:gap-0">
                <li>
                    <a href="/" class="flex m-0 md:ml-6 px-3 py-3 lg:py-2 lg:!text-surface-0 text-surface-200 hover:text-orange-400 transition-colors duration-200 text-sm font-medium rounded-lg lg:rounded-none" pStyleClass="#menu" enterFromClass="hidden" leaveToClass="hidden">
                        <i class="pi pi-home mr-2 lg:hidden"></i>
                        Accueil
                    </a>
                </li>
                <li>
                    <a (click)="handleScroll('destinations')" class="flex m-0 md:ml-6 px-3 py-3 lg:py-2 lg:!text-surface-0 text-surface-200 hover:text-orange-400 transition-colors duration-200 text-sm font-medium cursor-pointer rounded-lg lg:rounded-none" pStyleClass="#menu" enterFromClass="hidden" leaveToClass="hidden">
                        <i class="pi pi-map mr-2 lg:hidden"></i>
                        Destinations
                    </a>
                </li>
                <li>
                    <a (click)="handleScroll('services')" class="flex m-0 md:ml-6 px-3 py-3 lg:py-2 lg:!text-surface-0 text-surface-200 hover:text-orange-400 transition-colors duration-200 text-sm font-medium cursor-pointer rounded-lg lg:rounded-none" pStyleClass="#menu" enterFromClass="hidden" leaveToClass="hidden">
                        <i class="pi pi-cog mr-2 lg:hidden"></i>
                        Services
                    </a>
                </li>
                <li>
                    <a (click)="handleScroll('about')" class="flex m-0 md:ml-6 px-3 py-3 lg:py-2 lg:!text-surface-0 text-surface-200 hover:text-orange-400 transition-colors duration-200 text-sm font-medium cursor-pointer rounded-lg lg:rounded-none" pStyleClass="#menu" enterFromClass="hidden" leaveToClass="hidden">
                        <i class="pi pi-info-circle mr-2 lg:hidden"></i>
                        A propos
                    </a>
                </li>
                <li class="mt-2 lg:mt-0 lg:ml-6">
                    <a [href]="loginUrl" pButton pRipple class="!bg-orange-500 hover:!bg-orange-600 !border-orange-500 hover:!border-orange-600 rounded-lg px-5 py-2.5 text-sm font-semibold w-full lg:w-auto justify-center">
                        <i class="pi pi-sign-in mr-2"></i>
                        Se connecter
                    </a>
                </li>
            </ul>
        </nav>
    </header>`
})
export class Topbar {
    loginUrl = loginUrl;
    handleScroll(id: string) {
        const element = document.getElementById(id);
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }, 200);
        }
    }
}
