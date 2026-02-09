import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { IVilleCreateRequest, IVilleUpdateRequest } from '@/interface/ville';

@Injectable({
    providedIn: 'root'
})
export class VilleService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/billetterie/villes`;

    constructor() {}

    /**
     * Récupère toutes les villes
     */
    getAllVilles$ = (): Observable<IResponse> => this.http.get<IResponse>(this.baseUrl).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère uniquement les villes actives
     */
    getActiveVilles$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère une ville par son UUID
     */
    getVilleByUuid$ = (villeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/${villeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les villes d'une région
     */
    getVillesByRegion$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les villes actives d'une région
     */
    getActiveVillesByRegion$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Crée une nouvelle ville
     */
    createVille$ = (request: IVilleCreateRequest): Observable<IResponse> => this.http.post<IResponse>(this.baseUrl, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Met à jour une ville
     */
    updateVille$ = (villeUuid: string, request: IVilleUpdateRequest): Observable<IResponse> => this.http.put<IResponse>(`${this.baseUrl}/${villeUuid}`, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Active ou désactive une ville
     */
    updateVilleStatus$ = (villeUuid: string, actif: boolean): Observable<IResponse> => this.http.patch<IResponse>(`${this.baseUrl}/${villeUuid}/status`, { actif }).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('VilleService Error:', httpErrorResponse);
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
            error = 'Ville non trouvée.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Cette ville existe déjà dans cette région.';
        }

        return throwError(() => error);
    };
}
