import { Key } from '@/enum/cache.key';
import { StorageService } from '@/service/storage.service';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';

export const TokenInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    console.log('🔥 TokenInterceptor DÉCLENCHÉ pour:', request.url);

    const storage = inject(StorageService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // Skip authorization for certain URLs
    if (shouldSkipAuthorization(request)) {
        console.log('⏭️ Skipping authorization pour:', request.url);
        return next(request);
    }

    console.log('✅ TokenInterceptor va traiter:', request.url);

    // Get token from storage service
    const token = storage.get(Key.TOKEN);
    console.log('🔍 Token récupéré du storage:', token ? `${token.substring(0, 30)}...` : 'NULL/UNDEFINED');

    // Add token to request ONLY if token exists and is valid
    const authRequest = addAuthorizationTokenHeader(request, token);
    console.log('📨 Requête avec Authorization header:', authRequest.headers.has('Authorization'));

    return next(authRequest).pipe(
        catchError((error: HttpErrorResponse) => {
            console.log('❌ Erreur HTTP interceptée:', error.status, error.statusText, 'pour URL:', request.url);
            console.log('🔍 Détails erreur:', error.error);

            // If unauthorized, redirect to login
            if (error.status === 401) {
                console.log("🚫 401 Unauthorized - Redirection vers page d'accueil");
                handleAuthFailure(storage, router);
            }
            return throwError(() => error);
        })
    );
};

// Helper functions
function shouldSkipAuthorization(request: HttpRequest<unknown>): boolean {
    const skipUrls = [
        'verify',
        'login',
        'refresh',
        'resetpassword',
        'oauth2/token',
        'search',
        // Endpoints publics (home avant connexion) : ne JAMAIS y attacher de
        // Bearer — un token expiré/invalide provoque un 401 même sur du
        // permitAll (le resource server rejette avant l'autorisation).
        'billetterie/villes/active',
        'billetterie/offres/recherche'
    ];
    return skipUrls.some((url) => request.url.includes(url));
}

function handleAuthFailure(storage: StorageService, router: Router): void {
    // Clear tokens and redirect to login
    storage.remove(Key.TOKEN);
    storage.remove(Key.REFRESH_TOKEN);
    router.navigate(['/']); // Redirection vers la page d'accueil
}

function addAuthorizationTokenHeader(request: HttpRequest<unknown>, token: any): HttpRequest<unknown> {
    console.log('🏗️ addAuthorizationTokenHeader appelée avec token ...:', token ? 'PRÉSENT' : 'ABSENT');

    // CORRECTION : Vérifier si le token existe ET n'est pas vide
    if (!token || token === '' || token === 'null' || token === 'undefined') {
        console.log('⚠️ Token invalide, requête non modifiée');
        return request; // Retourner la requête sans modification
    }

    const modifiedRequest = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Header Authorization ajouté à la requête');
    console.log('🔍 Headers finaux:', modifiedRequest.headers.keys());

    return modifiedRequest;
}
