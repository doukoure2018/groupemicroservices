import { IUser } from '@/interface/user';
import { UserService } from '@/service/user.service';
import { AgenceOnboardingService } from '@/service/agence-onboarding.service';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AdminComponent } from '../admin/admin.component';
import { RespAgentComponent } from '../resp-agent/resp-agent.component';

@Component({
    selector: 'app-home',
    imports: [AdminComponent, RespAgentComponent],
    templateUrl: './home.component.html'
})
export class HomeComponent {
    state = signal<{ user?: IUser; loading: boolean; message: string | undefined; error: string | any }>({
        loading: false,
        message: undefined,
        error: undefined
    });
    private destroyRef = inject(DestroyRef);
    private userService = inject(UserService);
    private onboardingService = inject(AgenceOnboardingService);
    private router = inject(Router);

    ngOnInit(): void {
        this.loadUserProfile();
    }
    private loadUserProfile(): void {
        this.state.update((state) => ({ ...state, loading: true, message: undefined, error: undefined }));
        this.userService
            .getInstanceUser$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.state.update((state) => ({ ...state, loading: false, user: response.data.user, message: undefined, error: undefined }));
                    this.redirectAgenceIfIncomplete(response.data.user);
                },
                error: (error) => {
                    this.state.update((state) => ({ ...state, loading: false, user: undefined, message: undefined, error }));
                },
                complete: () => {}
            });
    }

    /**
     * Agence immobilière (ADMIN_IMMO) : tant que le dossier n'est pas VERIFIE,
     * on affiche directement l'espace « Mon agence » (formulaire de complétion
     * ou statut de validation conformité) sans passer par le menu.
     */
    private redirectAgenceIfIncomplete(user?: IUser): void {
        const roles = (user?.role ?? '').split(',').map((r) => r.trim());
        if (!roles.includes('ADMIN_IMMO')) return;
        this.onboardingService
            .getMe$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    if (response.data?.['statut'] !== 'VERIFIE') {
                        this.router.navigate(['/dashboards/agence']);
                    }
                },
                error: () => this.router.navigate(['/dashboards/agence'])
            });
    }
}
