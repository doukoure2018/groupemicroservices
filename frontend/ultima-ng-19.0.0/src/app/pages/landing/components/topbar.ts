import { Component } from '@angular/core';
import { StyleClassModule } from 'primeng/styleclass';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'topbar',
    standalone: true,
    imports: [RouterModule, StyleClassModule, ButtonModule, RippleModule],
    template: `<div style="height: 68px; backdrop-filter: blur(17px)" class="flex justify-between items-center z-30 px-8 bg-black/40 top-0 w-full fixed">
        <div>
            <img [attr.draggable]="false" src="/layout/images/logo/logo.png" alt="logo" />
        </div>

        <a class="cursor-pointer block lg:hidden text-white" pStyleClass="@next" enterFromClass="hidden" leaveToClass="hidden" [hideOnOutsideClick]="true">
            <i class="pi pi-bars !text-4xl"></i>
        </a>

        <div id="menu" class="items-center grow hidden lg:flex absolute lg:static w-full lg:px-0 z-30 shadow lg:shadow-none animate-fadein bg-surface-0 lg:!bg-transparent" style="top: 68px; right: 0%">
            <ul class="list-none p-4 lg:p-0 m-0 ml-auto flex lg:items-center select-none flex-col lg:flex-row cursor-pointer">
                <li>
                    <a class="flex m-0 md:ml-8 px-0 py-4 lg:!text-surface-0 text-surface-900 leading-normal" pStyleClass="#menu" enterFromClass="hidden" leaveToClass="hidden">
                        <span>HOME</span>
                    </a>
                </li>

                <li>
                    <a
                        [routerLink]="['/auth/forgotpassword']"
                        class="flex m-0 md:ml-8 px-0 py-4 lg:!text-surface-0 text-surface-900 leading-normal"
                        (click)="handleScroll('collaboration')"
                        pStyleClass="#menu"
                        enterFromClass="hidden"
                        leaveToClass="hidden"
                    >
                        <span>Mot de passe Oublié</span>
                    </a>
                </li>

                <li>
                    <a
                        href="http://localhost:8090/oauth2/authorize?response_type=code&client_id=client&scope=openid&redirect_uri=http://localhost:4202&code_challenge_method=S256&code_challenge=vesLhZA4cwKsKZAR7zvEJ9q3uI6dRM8nwna-IpuKkkk"
                        pButton
                        pRipple
                        class="!bg-surface-900 !border-surface-900 m-0 mt-4 md:mt-0 md:ml-8 rounded-md px-3 py-2§"
                        ><span pButtonLabel class="font-medium text-surface-0">Login</span></a
                    >
                </li>
            </ul>
        </div>
    </div>`
})
export class Topbar {
    handleScroll(id: string) {
        const element = document.getElementById(id);
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }, 200);
        }
    }
}
