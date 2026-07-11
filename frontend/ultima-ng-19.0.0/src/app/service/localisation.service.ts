import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
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
    getAllLocalisations$ = (): Observable<IResponse> => this.http.get<IResponse>(this.baseUrl).pipe(catchError(this.handleError));

    /**
     * Récupère les localisations avec quartier
     */
    getLocalisationsWithQuartier$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/with-quartier`).pipe(catchError(this.handleError));

    /**
     * Récupère les localisations sans quartier
     */
    getLocalisationsWithoutQuartier$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/without-quartier`).pipe(catchError(this.handleError));

    /**
     * Récupère une localisation par son UUID
     */
    getLocalisationByUuid$ = (localisationUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/${localisationUuid}`).pipe(catchError(this.handleError));

    /**
     * Récupère les localisations d'un quartier
     */
    getLocalisationsByQuartier$ = (quartierUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/quartier/${quartierUuid}`).pipe(catchError(this.handleError));

    /**
     * Récupère les localisations d'une commune
     */
    getLocalisationsByCommune$ = (communeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/commune/${communeUuid}`).pipe(catchError(this.handleError));

    /**
     * Récupère les localisations d'une ville
     */
    getLocalisationsByVille$ = (villeUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(catchError(this.handleError));

    /**
     * Récupère les localisations d'une région
     */
    getLocalisationsByRegion$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}`).pipe(catchError(this.handleError));

    /**
     * Recherche des localisations par adresse
     */
    searchLocalisations$ = (searchTerm: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`).pipe(catchError(this.handleError));

    /**
     * Crée une nouvelle localisation
     */
    createLocalisation$ = (request: ILocalisationCreateRequest): Observable<IResponse> => this.http.post<IResponse>(this.baseUrl, request).pipe(catchError(this.handleError));

    /**
     * Met à jour une localisation
     */
    updateLocalisation$ = (localisationUuid: string, request: ILocalisationUpdateRequest): Observable<IResponse> => this.http.put<IResponse>(`${this.baseUrl}/${localisationUuid}`, request).pipe(catchError(this.handleError));

    /**
     * Supprime une localisation
     */
    deleteLocalisation$ = (localisationUuid: string): Observable<IResponse> => this.http.delete<IResponse>(`${this.baseUrl}/${localisationUuid}`).pipe(catchError(this.handleError));

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
