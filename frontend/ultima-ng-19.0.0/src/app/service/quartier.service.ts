import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { IQuartierCreateRequest, IQuartierUpdateRequest } from '@/interface/quartier';

@Injectable({
    providedIn: 'root'
})
export class QuartierService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/billetterie/quartiers`;

    constructor() {}

    /**
     * Récupère tous les quartiers
     */
    getAllQuartiers$ = (): Observable<IResponse> => this.http.get<IResponse>(this.baseUrl).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère uniquement les quartiers actifs
     */
    getActiveQuartiers$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère un quartier par son UUID
     */
    getQuartierByUuid$ = (quartierUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/${quartierUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les quartiers d'une commune
     */
    getQuartiersByCommune$ = (communeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/commune/${communeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les quartiers actifs d'une commune
     */
    getActiveQuartiersByCommune$ = (communeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/commune/${communeUuid}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les quartiers d'une ville
     */
    getQuartiersByVille$ = (villeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les quartiers d'une région
     */
    getQuartiersByRegion$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Crée un nouveau quartier
     */
    createQuartier$ = (request: IQuartierCreateRequest): Observable<IResponse> => this.http.post<IResponse>(this.baseUrl, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Met à jour un quartier
     */
    updateQuartier$ = (quartierUuid: string, request: IQuartierUpdateRequest): Observable<IResponse> => this.http.put<IResponse>(`${this.baseUrl}/${quartierUuid}`, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Active ou désactive un quartier
     */
    updateQuartierStatus$ = (quartierUuid: string, actif: boolean): Observable<IResponse> => this.http.patch<IResponse>(`${this.baseUrl}/${quartierUuid}/status`, { actif }).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('QuartierService Error:', httpErrorResponse);
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
            error = 'Quartier non trouvé.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Ce quartier existe déjà dans cette commune.';
        }

        return throwError(() => error);
    };
}
