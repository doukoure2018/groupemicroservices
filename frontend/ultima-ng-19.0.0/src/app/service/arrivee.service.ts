import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Arrivee, ArriveeRequest } from '@/interface/arrivee.model';

@Injectable({
    providedIn: 'root'
})
export class ArriveeService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/arrivees`;

    /**
     * Récupère toutes les arrivées
     */
    getAll(): Observable<Arrivee[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère toutes les arrivées actives
     */
    getAllActifs(): Observable<Arrivee[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère une arrivée par son UUID
     */
    getByUuid(uuid: string): Observable<Arrivee> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.arrivee as Arrivee),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les arrivées par site d'arrivée
     */
    getBySite(siteUuid: string): Observable<Arrivee[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/site/${siteUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les arrivées par départ
     */
    getByDepart(departUuid: string): Observable<Arrivee[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/depart/${departUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les arrivées par ville d'arrivée
     */
    getByVilleArrivee(villeUuid: string): Observable<Arrivee[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville-arrivee/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les arrivées par ville de départ
     */
    getByVilleDepart(villeUuid: string): Observable<Arrivee[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville-depart/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les arrivées pour un trajet (départ + ville d'arrivée)
     */
    getByTrajet(departUuid: string, villeArriveeUuid: string): Observable<Arrivee[]> {
        return this.http
            .get<IResponse>(`${this.baseUrl}/trajet`, {
                params: { departUuid, villeArriveeUuid }
            })
            .pipe(
                tap(console.log),
                map((response) => response.data?.arrivees || []),
                catchError(this.handleError)
            );
    }

    /**
     * Recherche des arrivées
     */
    search(query: string): Observable<Arrivee[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.arrivees || []),
            catchError(this.handleError)
        );
    }

    /**
     * Crée une nouvelle arrivée
     */
    create(request: ArriveeRequest): Observable<Arrivee> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.arrivee as Arrivee),
            catchError(this.handleError)
        );
    }

    /**
     * Met à jour une arrivée
     */
    update(uuid: string, request: ArriveeRequest): Observable<Arrivee> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.arrivee as Arrivee),
            catchError(this.handleError)
        );
    }

    /**
     * Bascule le statut actif d'une arrivée
     */
    toggleActif(uuid: string): Observable<Arrivee> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/toggle-actif`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.arrivee as Arrivee),
            catchError(this.handleError)
        );
    }

    /**
     * Supprime une arrivée
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
        console.error('ArriveeService Error:', httpErrorResponse);
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
            error = 'Arrivée non trouvée.';
        } else if (httpErrorResponse.status === 409) {
            error = 'Cette arrivée existe déjà.';
        }

        return throwError(() => error);
    };
}
