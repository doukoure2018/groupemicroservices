import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Depart, DepartRequest } from '@/interface/depart.model';

@Injectable({
    providedIn: 'root'
})
export class DepartService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/departs`;

    /**
     * Récupère tous les départs
     */
    getAll(): Observable<Depart[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.departs || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère tous les départs actifs
     */
    getAllActifs(): Observable<Depart[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.departs || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère un départ par son UUID
     */
    getByUuid(uuid: string): Observable<Depart> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.depart as Depart),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les départs par site
     */
    getBySite(siteUuid: string): Observable<Depart[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/site/${siteUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.departs || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les départs actifs par site
     */
    getBySiteActifs(siteUuid: string): Observable<Depart[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/site/${siteUuid}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.departs || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les départs par ville
     */
    getByVille(villeUuid: string): Observable<Depart[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.departs || []),
            catchError(this.handleError)
        );
    }

    /**
     * Recherche des départs
     */
    search(query: string): Observable<Depart[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.departs || []),
            catchError(this.handleError)
        );
    }

    /**
     * Crée un nouveau départ
     */
    create(request: DepartRequest): Observable<Depart> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.depart as Depart),
            catchError(this.handleError)
        );
    }

    /**
     * Met à jour un départ
     */
    update(uuid: string, request: DepartRequest): Observable<Depart> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.depart as Depart),
            catchError(this.handleError)
        );
    }

    /**
     * Bascule le statut actif d'un départ
     */
    toggleActif(uuid: string): Observable<Depart> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/toggle-actif`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.depart as Depart),
            catchError(this.handleError)
        );
    }

    /**
     * Supprime un départ
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
        console.error('DepartService Error:', httpErrorResponse);
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
            error = 'Départ non trouvé.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Ce départ existe déjà.';
        }

        return throwError(() => error);
    };
}
