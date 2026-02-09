import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { ILocalisationCreateRequest, ILocalisationUpdateRequest } from '@/interface/localisation';

@Injectable({
    providedIn: 'root'
})
export class LocalisationService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/billetterie/localisations`;

    constructor() {}

    /**
     * Récupère toutes les localisations
     */
    getAllLocalisations$ = (): Observable<IResponse> => this.http.get<IResponse>(this.baseUrl).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les localisations avec quartier
     */
    getLocalisationsWithQuartier$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/with-quartier`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les localisations sans quartier
     */
    getLocalisationsWithoutQuartier$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/without-quartier`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère une localisation par son UUID
     */
    getLocalisationByUuid$ = (localisationUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/${localisationUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les localisations d'un quartier
     */
    getLocalisationsByQuartier$ = (quartierUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/quartier/${quartierUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les localisations d'une commune
     */
    getLocalisationsByCommune$ = (communeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/commune/${communeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les localisations d'une ville
     */
    getLocalisationsByVille$ = (villeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère les localisations d'une région
     */
    getLocalisationsByRegion$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Recherche des localisations par adresse
     */
    searchLocalisations$ = (searchTerm: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Crée une nouvelle localisation
     */
    createLocalisation$ = (request: ILocalisationCreateRequest): Observable<IResponse> => this.http.post<IResponse>(this.baseUrl, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Met à jour une localisation
     */
    updateLocalisation$ = (localisationUuid: string, request: ILocalisationUpdateRequest): Observable<IResponse> => this.http.put<IResponse>(`${this.baseUrl}/${localisationUuid}`, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Supprime une localisation
     */
    deleteLocalisation$ = (localisationUuid: string): Observable<IResponse> => this.http.delete<IResponse>(`${this.baseUrl}/${localisationUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('LocalisationService Error:', httpErrorResponse);
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
            error = 'Localisation non trouvée.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Cette adresse existe déjà.';
        }

        return throwError(() => error);
    };
}
