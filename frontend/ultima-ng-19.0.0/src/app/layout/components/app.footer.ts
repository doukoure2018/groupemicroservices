import {Component, inject} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {LayoutService} from "@/layout/service/layout.service";

@Component({
    standalone: true,
    selector: '[app-footer]',
    imports: [ButtonModule],
    template: ` <span class="font-medium text-lg text-muted-color" style="display:flex;align-items:center;">
        <!-- Logo SIRA Guinée — footer plus petit que topbar (32px vs 36px). -->
        <img src="/images/logo-sira-navbar.png" alt="SIRA Guinée — Transport & Immobilier" style="height:32px;width:auto;display:block;" />
    </span>
        <div class="flex gap-2">
            <button pButton icon="pi pi-facebook" rounded text severity="secondary"></button>
            <button pButton icon="pi pi-twitter" rounded text severity="secondary"></button>
        </div>`,
    host: {
        class: 'layout-footer'
    }
})
export class AppFooter {
    layoutService = inject(LayoutService);
}
