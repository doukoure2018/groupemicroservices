import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loginUrl } from '@/utils/fileutils';

@Component({
    selector: 'topbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './topbar.html',
})
export class Topbar {
    loginUrl = loginUrl;
    mobileOpen = signal(false);
    scrolled = signal(false);

    navLinks = [
        { label: 'Accueil', href: '#', active: true },
        { label: 'Destinations', href: '#destinations', active: false },
        { label: 'Services', href: '#services', active: false },
        { label: 'Comment ca marche', href: '#how-it-works', active: false },
        { label: 'A propos', href: '#about', active: false },
        { label: 'Contact', href: '#contact', active: false },
    ];

    @HostListener('window:scroll')
    onScroll(): void {
        this.scrolled.set(window.scrollY > 20);
    }

    toggleMobile(): void {
        this.mobileOpen.update((v) => !v);
    }

    closeMobile(): void {
        this.mobileOpen.set(false);
    }
}
