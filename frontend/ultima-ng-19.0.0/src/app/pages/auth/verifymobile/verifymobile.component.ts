import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { EMPTY, switchMap } from 'rxjs';
import { UserService } from '@/service/user.service';

/**
 * Web-bridge Phase 2 (souscription mobile) — route /auth/verify/mobile?token=XXX.
 *
 * Appelle POST /authorization/api/auth/verify-mobile : active le compte ET
 * récupère les tokens. Puis :
 *  - mobile : redirige vers sira://verify?accessToken=...&refreshToken=...
 *    (le scheme sira est capté par l'app → auto-login → Hub) ;
 *  - desktop / app absente : message « compte vérifié, ouvrez l'app ».
 *
 * NB sécurité : les tokens transitent dans l'URL sira:// (cf dette
 * web-bridge-tokens-in-url). Idéal futur = one-time code ou Universal Links.
 */
@Component({
    selector: 'app-verifymobile',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule, ButtonModule],
    templateUrl: './verifymobile.component.html'
})
export class VerifymobileComponent {
    // 'loading' | 'mobile-ok' | 'desktop-ok' | 'error'
    state = signal<{ status: string; message?: string }>({ status: 'loading' });

    private destroyRef = inject(DestroyRef);
    private userService = inject(UserService);
    private route = inject(ActivatedRoute);

    private deepLink?: string;
    readonly isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(
                switchMap((params: ParamMap) => {
                    const token = params.get('token');
                    if (!token) {
                        this.state.set({ status: 'error', message: 'Lien invalide. Token manquant.' });
                        return EMPTY;
                    }
                    this.state.set({ status: 'loading' });
                    return this.userService.verifyMobile$(token);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (resp: any) => {
                    const access = resp?.access_token;
                    const refresh = resp?.refresh_token;
                    const id = resp?.id_token;
                    if (this.isMobile && access && refresh) {
                        let dl = `sira://verify?accessToken=${encodeURIComponent(access)}&refreshToken=${encodeURIComponent(refresh)}`;
                        if (id) dl += `&idToken=${encodeURIComponent(id)}`;
                        this.deepLink = dl;
                        this.state.set({ status: 'mobile-ok' });
                        // Laisse le DOM se peindre puis tente d'ouvrir l'app.
                        setTimeout(() => this.openApp(), 500);
                    } else {
                        this.state.set({ status: 'desktop-ok' });
                    }
                },
                error: (error: any) => {
                    this.state.set({ status: 'error', message: typeof error === 'string' ? error : 'Échec de la vérification. Lien invalide ou expiré.' });
                }
            });
    }

    openApp = (): void => {
        if (this.deepLink) {
            window.location.href = this.deepLink;
        }
    };
}
