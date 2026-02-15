import { Key } from '@/enum/cache.key';
import { IAuthentication } from '@/interface/IAuthentication';

import { Topbar } from '@/pages/landing/components/topbar';
import { StorageService } from '@/service/storage.service';
import { UserService } from '@/service/user.service';
import { getFormData, redirectUri } from '@/utils/fileutils';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { catchError, delay, take, tap, throwError } from 'rxjs';

@Component({
    selector: 'app-home',
    imports: [ProgressSpinnerModule, RouterModule, IconFieldModule, InputIconModule, InputTextModule, Topbar],
    templateUrl: './home.component.html',
    styles: `
        ::placeholder {
            color: #fff;
        }
    `,
    providers: [MessageService]
})
export class HomeComponent {
    loading = signal<boolean>(true);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private storage = inject(StorageService);
    private userService = inject(UserService);
    private activatedRoute = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    ngOnInit(): void {
        // Keep loading true until we explicitly set it to false
        this.loading.set(true);

        // First check if user is already authenticated
        if (this.userService.isAuthenticated() && !this.userService.isTokenExpired()) {
            console.log('User already authenticated, redirecting...');
            const redirectUrl = this.storage.getRedirectUrl() || '/dashboards';

            // Only navigate after ensuring loading is true
            setTimeout(() => {
                this.router.navigate([redirectUrl]);
            }, 0);

            return;
        }

        console.log('Checking for OAuth code in DashboardAnalytics');
        this.activatedRoute.queryParamMap
            .pipe(
                take(1), // Only take first emission to prevent multiple subscriptions
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((params) => {
                // Get code from either route params or window location
                const code = params.get('code');
                console.log('OAuth code from ActivatedRoute:', code);

                const urlParams = new URLSearchParams(window.location.search);
                const urlCode = urlParams.get('code');
                console.log('OAuth code from window.location:', urlCode);

                const authCode = code || urlCode;

                if (authCode) {
                    console.log('Processing authentication with code:', authCode);

                    // Ensure loading is true during validation
                    this.loading.set(true);

                    this.userService
                        .validateCode$(this.formData(authCode))
                        .pipe(
                            delay(3 * 1000),
                            takeUntilDestroyed(this.destroyRef),
                            // Ensure loading stays true during this operation
                            tap(() => this.loading.set(true)),
                            catchError((err) => {
                                console.error('Authentication error:', err);
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
                                console.log('Authentication successful, tokens saved');

                                // Keep loading true while we navigate
                                const currentUrlWithoutParams = this.router.url.split('?')[0];

                                // Use setTimeout to ensure proper change detection
                                setTimeout(() => {
                                    this.router.navigateByUrl(currentUrlWithoutParams).then(() => {
                                        // Only set loading to false after navigation completes
                                        setTimeout(() => {
                                            this.loading.set(false);
                                        }, 100);
                                    });
                                }, 0);
                            },
                            error: () => {
                                // Error handling moved to catchError operator
                            }
                        });
                } else {
                    console.log('No OAuth code found, continuing normal initialization');
                    // Add a small delay before showing content to prevent flicker
                    setTimeout(() => {
                        this.loading.set(false);
                    }, 100);
                }
            });
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
        console.log('Saving auth tokens');
        this.storage.set(Key.TOKEN, response.access_token);
        this.storage.set(Key.REFRESH_TOKEN, response.refresh_token || response.access_token);
    };
}
