import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';

/**
 * Écran admin « Agences » : liste des agences avec compteurs d'activité
 * et détail par agence (annonces, agents, représentant).
 */
@Injectable({ providedIn: 'root' })
export class AgenceAdminService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/immo/agences/admin`;

    getAgences$ = (limit = 50, offset = 0): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}?limit=${limit}&offset=${offset}&_t=${Date.now()}`).pipe(catchError(this.handleError));

    getDetail$ = (agenceUuid: string): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}/${agenceUuid}/activites?_t=${Date.now()}`).pipe(catchError(this.handleError));

    private handleError(error: any): Observable<never> {
        const message = error?.error?.message || error?.message || 'Une erreur est survenue';
        return throwError(() => message);
    }
}
