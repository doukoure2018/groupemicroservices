import { Key } from '@/enum/cache.key';
import { IAuthentication } from '@/interface/IAuthentication';
import { Topbar } from '@/pages/landing/components/topbar';
import { StorageService } from '@/service/storage.service';
import { UserService } from '@/service/user.service';
import { getFormData, loginUrl, redirectUri } from '@/utils/fileutils';
import { ScrollAnimationDirective, CountUpDirective } from '@/directives/scroll-animation.directive';
import { GuineaMapComponent } from './components/guinea-map.component';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { catchError, delay, take, tap, throwError } from 'rxjs';

interface Destination {
    id: string;
    name: string;
    badge: string;
    trips: string;
    price: string;
    image: string;
    rating: number;
}

interface FooterColumn {
    title: string;
    links: { label: string; href: string }[];
}

@Component({
    selector: 'app-home',
    imports: [CommonModule, ProgressSpinnerModule, Topbar, ScrollAnimationDirective, CountUpDirective, GuineaMapComponent],
    templateUrl: './home.component.html',
    providers: [MessageService]
})
export class HomeComponent {
    loginUrl = loginUrl;
    loading = signal<boolean>(true);
    activeCity = signal<string | null>(null);
    mapVisible = signal(true);
    currentYear = new Date().getFullYear();

    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private storage = inject(StorageService);
    private userService = inject(UserService);
    private activatedRoute = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    // Hero stats
    heroStats = [
        { end: 50, suffix: '+', label: 'Destinations' },
        { end: 200, suffix: '+', label: 'Trajets par jour' },
        { end: 10, suffix: 'K+', label: 'Voyageurs' },
    ];

    cities = ['Conakry', 'Kankan', 'Labe', 'Nzerekore', 'Mamou', 'Boke'];
    times = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00'];

    // Destinations
    destinations: Destination[] = [
        { id: 'conakry', name: 'Conakry', badge: 'Capitale', trips: '15+ trajets/jour', price: '150 000 GNF', image: 'images/conakry.jpg', rating: 4.8 },
        { id: 'kankan', name: 'Kankan', badge: 'Haute Guinee', trips: '10+ trajets/jour', price: '250 000 GNF', image: 'images/kankan.jpg', rating: 4.6 },
        { id: 'labe', name: 'Labe', badge: 'Moyenne Guinee', trips: '12+ trajets/jour', price: '200 000 GNF', image: 'images/labe.jpg', rating: 4.7 },
        { id: 'nzerekore', name: 'Nzerekore', badge: 'Guinee Forestiere', trips: '8+ trajets/jour', price: '300 000 GNF', image: 'images/nzerekore.jpg', rating: 4.5 },
        { id: 'mamou', name: 'Mamou', badge: 'Carrefour', trips: '14+ trajets/jour', price: '180 000 GNF', image: 'images/mamou.jpg', rating: 4.4 },
        { id: 'boke', name: 'Boke', badge: 'Basse Guinee', trips: '6+ trajets/jour', price: '220 000 GNF', image: 'images/boke.jpg', rating: 4.3 },
    ];

    // Services
    services = [
        { icon: 'shield', title: 'Securite garantie', desc: 'Vehicules controles, chauffeurs certifies et assurance voyage incluse pour tous les passagers.', color: '#3b82f6' },
        { icon: 'clock', title: 'Ponctualite assuree', desc: 'Departs a l\'heure avec un suivi GPS en temps reel de tous nos vehicules sur chaque trajet.', color: '#f97316' },
        { icon: 'wallet', title: 'Prix competitifs', desc: 'Les meilleurs tarifs du marche avec des offres speciales et des reductions pour les voyageurs frequents.', color: '#10b981' },
        { icon: 'headphones', title: 'Support 24/7', desc: 'Une equipe dediee disponible jour et nuit pour vous accompagner avant, pendant et apres votre voyage.', color: '#8b5cf6' },
        { icon: 'map', title: 'Large couverture', desc: 'Plus de 50 destinations a travers toute la Guinee avec des connexions vers toutes les regions.', color: '#ef4444' },
        { icon: 'smartphone', title: 'Reservation facile', desc: 'Reservez en quelques clics depuis votre telephone avec confirmation instantanee par SMS.', color: '#06b6d4' },
    ];

    // How it works
    steps = [
        { step: 1, icon: 'search', title: 'Recherchez', desc: 'Choisissez votre trajet, date et nombre de passagers.', colorFrom: '#f97316', colorTo: '#fbbf24', ringColor: 'rgba(249,115,22,0.2)' },
        { step: 2, icon: 'bar-chart', title: 'Comparez', desc: 'Consultez les offres, horaires et prix disponibles.', colorFrom: '#3b82f6', colorTo: '#22d3ee', ringColor: 'rgba(59,130,246,0.2)' },
        { step: 3, icon: 'credit-card', title: 'Payez', desc: 'Mobile money ou carte bancaire, en toute securite.', colorFrom: '#8b5cf6', colorTo: '#a855f7', ringColor: 'rgba(139,92,246,0.2)' },
        { step: 4, icon: 'ticket', title: 'Voyagez', desc: 'Recevez votre billet electronique et partez sereinement.', colorFrom: '#10b981', colorTo: '#14b8a6', ringColor: 'rgba(16,185,129,0.2)' },
    ];

    // About
    aboutStats = [
        { value: 10000, suffix: '+', label: 'Voyageurs satisfaits', decimal: false },
        { value: 50, suffix: '+', label: 'Destinations couvertes', decimal: false },
        { value: 200, suffix: '+', label: 'Trajets quotidiens', decimal: false },
        { value: 48, suffix: '', label: 'Note moyenne', decimal: true },
    ];

    values = [
        { icon: 'shield', title: 'Securite', desc: 'La securite de nos passagers est notre priorite absolue.' },
        { icon: 'heart', title: 'Service client', desc: 'Un accompagnement personnalise a chaque etape du voyage.' },
        { icon: 'zap', title: 'Innovation', desc: 'Des solutions technologiques modernes pour simplifier vos voyages.' },
    ];

    // Download app features
    appFeatures = [
        'Reservation instantanee',
        'Suivi GPS en temps reel',
        'Paiement Mobile Money',
        'Notifications et alertes',
    ];

    // Footer
    footerColumns: FooterColumn[] = [
        {
            title: 'Destinations',
            links: [
                { label: 'Conakry', href: '#' }, { label: 'Kankan', href: '#' },
                { label: 'Labe', href: '#' }, { label: 'Nzerekore', href: '#' },
                { label: 'Mamou', href: '#' }, { label: 'Boke', href: '#' },
            ],
        },
        {
            title: 'Entreprise',
            links: [
                { label: 'A propos', href: '#about' }, { label: 'Nos services', href: '#services' },
                { label: 'Carrieres', href: '#' }, { label: 'Presse', href: '#' },
                { label: 'Partenaires', href: '#' },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Centre d\'aide', href: '#' }, { label: 'FAQ', href: '#' },
                { label: 'Contact', href: '#contact' }, { label: 'Reclamations', href: '#' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Conditions generales', href: '#' },
                { label: 'Politique de confidentialite', href: '#' },
                { label: 'Cookies', href: '#' },
            ],
        },
    ];

    ngOnInit(): void {
        this.loading.set(true);

        if (this.userService.isAuthenticated() && !this.userService.isTokenExpired()) {
            const redirectUrl = this.storage.getRedirectUrl() || '/dashboards';
            setTimeout(() => {
                this.router.navigate([redirectUrl]);
            }, 0);
            return;
        }

        this.activatedRoute.queryParamMap
            .pipe(
                take(1),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((params) => {
                const code = params.get('code');
                const urlParams = new URLSearchParams(window.location.search);
                const urlCode = urlParams.get('code');
                const authCode = code || urlCode;

                if (authCode) {
                    this.loading.set(true);
                    this.userService
                        .validateCode$(this.formData(authCode))
                        .pipe(
                            delay(3 * 1000),
                            takeUntilDestroyed(this.destroyRef),
                            tap(() => this.loading.set(true)),
                            catchError((err) => {
                                this.loading.set(false);
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Verification Account',
                                    detail: typeof err === 'string' ? err : 'Authentication failed'
                                });
                                return throwError(() => err);
                            })
                        )
                        .subscribe({
                            next: (response: IAuthentication) => {
                                this.saveToken(response);
                                const redirectUrl = this.storage.getRedirectUrl() || '/dashboards';
                                setTimeout(() => {
                                    this.router.navigateByUrl(redirectUrl).then(() => {
                                        this.loading.set(false);
                                    });
                                }, 0);
                            },
                            error: () => {}
                        });
                } else {
                    setTimeout(() => {
                        this.loading.set(false);
                    }, 100);
                }
            });
    }

    onMapVisible(): void {
        this.mapVisible.set(true);
    }

    onCityHover(cityId: string | null): void {
        this.activeCity.set(cityId);
    }

    onCityClick(cityId: string): void {
        this.activeCity.set(cityId);
    }

    scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private formData = (code: string) =>
        getFormData({
            code,
            client_id: 'client',
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code_verifier: 'I9QaNEkHHKoTSHctlSPE8VEf2ccHL0AGWkLi41k5_JsX1ItWNT_DT3i8SPRfffzIk_Nm4kEnSjdLi_DNmWw3GgcUT11UHtYeGW2zgOmdGaaiCdSRt1tnJZ4qclFwvpt7'
        });

    private saveToken = (response: IAuthentication) => {
        this.storage.set(Key.TOKEN, response.access_token);
        this.storage.set(Key.REFRESH_TOKEN, response.refresh_token || response.access_token);
    };
}
