import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';

/**
 * Backoffice conformité (rôle ADMIN_CONFORMITE) : validation des dossiers
 * d'agences immobilières soumis via l'onboarding.
 */
@Injectable({ providedIn: 'root' })
export class ConformiteService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/immo/conformite`;

    getDossiers$ = (limit = 50, offset = 0): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}/agences?limit=${limit}&offset=${offset}&_t=${Date.now()}`).pipe(catchError(this.handleError));

    /** Télécharge le RCCM (streaming authentifié) en blob — le token est ajouté par l'intercepteur.
     *  _t contourne le CacheInterceptor (un blob ne doit pas être mis en cache mémoire). */
    getRccmBlob$ = (agenceUuid: string): Observable<Blob> =>
        this.http.get(`${this.baseUrl}/agences/${agenceUuid}/rccm?_t=${Date.now()}`, { responseType: 'blob' }).pipe(catchError(this.handleError));

    approuver$ = (agenceUuid: string): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/agences/${agenceUuid}/approuver`, {}).pipe(tap(console.log), catchError(this.handleError));

    rejeter$ = (agenceUuid: string, motif: string): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/agences/${agenceUuid}/rejeter`, { motif }).pipe(tap(console.log), catchError(this.handleError));

    private handleError(error: any): Observable<never> {
        console.error(error);
        const message = error?.error?.message || error?.message || 'Une erreur est survenue';
        return throwError(() => message);
    }
}
