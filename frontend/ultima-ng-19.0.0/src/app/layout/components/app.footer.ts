import {Component, inject} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {LayoutService} from "@/layout/service/layout.service";

@Component({
    standalone: true,
    selector: '[app-footer]',
    imports: [ButtonModule],
    template: ` <span class="font-medium text-lg text-muted-color" style="display:flex;align-items:center;gap:8px;">
        <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#f97316,#ea580c);flex-shrink:0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
            </svg>
        </div>
        <span style="font-size:14px;font-weight:700;">Billetterie<span style="color:#f97316;">GN</span></span>
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
