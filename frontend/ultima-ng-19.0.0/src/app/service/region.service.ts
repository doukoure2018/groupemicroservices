import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { IRegionCreateRequest, IRegionUpdateRequest, IRegionStatusRequest } from '@/interface/region';

@Injectable({
    providedIn: 'root'
})
export class RegionService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/billetterie/regions`;

    constructor() {}

    /**
     * Récupère toutes les régions
     */
    getAllRegions$ = (): Observable<IResponse> => this.http.get<IResponse>(this.baseUrl).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère uniquement les régions actives
     */
    getActiveRegions$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/active`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Récupère une région par son UUID
     */
    getRegionByUuid$ = (regionUuid: string): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/${regionUuid}`).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Crée une nouvelle région
     */
    createRegion$ = (request: IRegionCreateRequest): Observable<IResponse> => this.http.post<IResponse>(this.baseUrl, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Met à jour le libellé et le code d'une région
     */
    updateRegion$ = (regionUuid: string, request: IRegionUpdateRequest): Observable<IResponse> => this.http.put<IResponse>(`${this.baseUrl}/${regionUuid}`, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Active ou désactive une région
     */
    updateRegionStatus$ = (regionUuid: string, request: IRegionStatusRequest): Observable<IResponse> => this.http.patch<IResponse>(`${this.baseUrl}/${regionUuid}/status`, request).pipe(tap(console.log), catchError(this.handleError));

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('RegionService Error:', httpErrorResponse);
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
            error = 'Région non trouvée.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Cette région existe déjà.';
        }

        return throwError(() => error);
    };
}
