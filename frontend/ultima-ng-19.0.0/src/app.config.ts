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

const MyPreset = definePreset(Material, {
    semantic: {
        primary: {
            50: '{indigo.50}',
            100: '{indigo.100}',
            200: '{indigo.200}',
            300: '{indigo.300}',
            400: '{indigo.400}',
            500: '{indigo.500}',
            600: '{indigo.600}',
            700: '{indigo.700}',
            800: '{indigo.800}',
            900: '{indigo.900}',
            950: '{indigo.950}'
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
        provideHttpClient(withFetch()),
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
