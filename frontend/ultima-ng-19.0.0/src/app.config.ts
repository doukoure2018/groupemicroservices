import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import Material from '@primeng/themes/material';
import { definePreset } from '@primeng/themes';
import { UserService } from '@/service/user.service';
import { StorageService } from '@/service/storage.service';
import { TokenInterceptor } from '@/interceptors/token.interceptor';
import { CacheInterceptor } from '@/interceptors/cache.interceptor';

// Branding SYNERGIA : vert forêt en couleur primaire (dérivé du logo).
// La palette 'green' de PrimeNG en est proche ; les tons 700/800 collent
// au vert du logo. L'or (#f2a900) reste l'accent, appliqué au cas par cas.
const MyPreset = definePreset(Material, {
    semantic: {
        primary: {
            50: '{green.50}',
            100: '{green.100}',
            200: '{green.200}',
            300: '{green.300}',
            400: '{green.400}',
            500: '{green.600}',
            600: '{green.700}',
            700: '{green.800}',
            800: '{green.900}',
            900: '{green.950}',
            950: '{green.950}'
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({
                anchorScrolling: 'enabled',
                scrollPositionRestoration: 'enabled'
            }),
            withEnabledBlockingInitialNavigation()
        ),
        provideHttpClient(withFetch(), withInterceptors([TokenInterceptor, CacheInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            inputStyle: 'filled',
            theme: { preset: MyPreset, options: { darkModeSelector: '.app-dark' } }
        }),

        UserService,
        StorageService
    ]
};
