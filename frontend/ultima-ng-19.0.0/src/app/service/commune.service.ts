import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { ICommuneCreateRequest, ICommuneUpdateRequest } from '@/interface/commune';

@Injectable({
    providedIn: 'root'
})
export class CommuneService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/billetterie/communes`;

    constructor() {}

    /**
     * Récupère toutes les communes
     */
    getAllCommunes$ = (): Observable<IResponse> => this.http.get<IResponse>(this.baseUrl).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère uniquement les communes actives
     */
    getActiveCommunes$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère une commune par son UUID
     */
    getCommuneByUuid$ = (communeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/${communeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les communes d'une ville
     */
    getCommunesByVille$ = (villeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les communes actives d'une ville
     */
    getActiveCommunesByVille$ = (villeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les communes d'une région
     */
    getCommunesByRegion$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Crée une nouvelle commune
     */
    createCommune$ = (request: ICommuneCreateRequest): Observable<IResponse> => this.http.post<IResponse>(this.baseUrl, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Met à jour une commune
     */
    updateCommune$ = (communeUuid: string, request: ICommuneUpdateRequest): Observable<IResponse> => this.http.put<IResponse>(`${this.baseUrl}/${communeUuid}`, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Active ou désactive une commune
     */
    updateCommuneStatus$ = (communeUuid: string, actif: boolean): Observable<IResponse> => this.http.patch<IResponse>(`${this.baseUrl}/${communeUuid}/status`, { actif }).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('CommuneService Error:', httpErrorResponse);
        let error: string = 'Une erreur est survenue. Veuillez réessayer.';

        if (httpErrorResponse.error instanceof ErrorEvent) {
            error = `Erreur client - ${httpErrorResponse.error.message}`;
            return throwError(() => error);
        }

        if (httpErrorResponse.error?.message) {
            error = httpErrorResponse.error.message;
            return throwError(() => error);
        }

        if (httpErrorResponse.status === 401) {
            error = 'Session expirée. Veuillez vous reconnecter.';
        } else if (httpErrorResponse.status === 403) {
            error = 'Accès non autorisé.';
        } else if (httpErrorResponse.status === 404) {
            error = 'Commune non trouvée.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Cette commune existe déjà dans cette ville.';
        }

        return throwError(() => error);
    };
}
