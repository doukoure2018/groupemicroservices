import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';

/**
 * Demandes de besoin des clients (V32), vues par les agences vérifiées
 * (rôle ADMIN_IMMO). scope=ZONE (commune/région de l'agence) ou TOUTES.
 */
@Injectable({ providedIn: 'root' })
export class DemandeClientService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/immo/demandes`;

    getDemandes$ = (scope: 'ZONE' | 'TOUTES' = 'ZONE', limit = 50, offset = 0): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}?scope=${scope}&limit=${limit}&offset=${offset}&_t=${Date.now()}`).pipe(catchError(this.handleError));

    private handleError(error: any): Observable<never> {
        console.error(error);
        const message = error?.error?.message || error?.message || 'Une erreur est survenue';
        return throwError(() => message);
    }
}
