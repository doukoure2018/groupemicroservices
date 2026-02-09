import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Site, SiteRequest } from '@/interface/site.model';

@Injectable({
    providedIn: 'root'
})
export class SiteService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/sites`;

    /**
     * Récupère tous les sites
     */
    getAll(): Observable<Site[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère tous les sites actifs
     */
    getAllActifs(): Observable<Site[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère un site par son UUID
     */
    getByUuid(uuid: string): Observable<Site> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.site as Site),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les sites par type
     */
    getByType(typeSite: string): Observable<Site[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/type/${typeSite}`).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les sites par localisation
     */
    getByLocalisation(localisationUuid: string): Observable<Site[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/localisation/${localisationUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les sites par ville
     */
    getByVille(villeUuid: string): Observable<Site[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les sites par commune
     */
    getByCommune(communeUuid: string): Observable<Site[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/commune/${communeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Recherche des sites
     */
    search(query: string): Observable<Site[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.sites || []),
            catchError(this.handleError)
        );
    }

    /**
     * Crée un nouveau site
     */
    create(request: SiteRequest): Observable<Site> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.site as Site),
            catchError(this.handleError)
        );
    }

    /**
     * Met à jour un site
     */
    update(uuid: string, request: SiteRequest): Observable<Site> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.site as Site),
            catchError(this.handleError)
        );
    }

    /**
     * Bascule le statut actif d'un site
     */
    toggleActif(uuid: string): Observable<Site> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/toggle-actif`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.site as Site),
            catchError(this.handleError)
        );
    }

    /**
     * Supprime un site
     */
    delete(uuid: string): Observable<void> {
        return this.http.delete<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map(() => void 0),
            catchError(this.handleError)
        );
    }

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('SiteService Error:', httpErrorResponse);
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
            error = 'Site non trouvé.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Ce site existe déjà.';
        }

        return throwError(() => error);
    };
}
