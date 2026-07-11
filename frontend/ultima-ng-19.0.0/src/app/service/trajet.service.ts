import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Trajet, TrajetRequest, TrajetStats } from '@/interface/trajet.model';

@Injectable({
    providedIn: 'root'
})
export class TrajetService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/trajets`;

    // ========== LECTURE ==========

    /**
     * Récupère tous les trajets
     */
    getAll(): Observable<Trajet[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère tous les trajets actifs
     */
    getAllActifs(): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère un trajet par son UUID
     */
    getByUuid(uuid: string): Observable<Trajet> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les trajets par départ
     */
    getByDepart(departUuid: string): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/depart/${departUuid}`).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les trajets par arrivée
     */
    getByArrivee(arriveeUuid: string): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/arrivee/${arriveeUuid}`).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les trajets par ville de départ
     */
    getByVilleDepart(villeUuid: string): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville-depart/${villeUuid}`).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les trajets par ville d'arrivée
     */
    getByVilleArrivee(villeUuid: string): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville-arrivee/${villeUuid}`).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les trajets entre deux villes
     */
    getByVilles(villeDepartUuid: string, villeArriveeUuid: string): Observable<Trajet[]> {
        const params = new HttpParams().set('villeDepartUuid', villeDepartUuid).set('villeArriveeUuid', villeArriveeUuid);

        return this.http.get<IResponse>(`${this.baseUrl}/villes`, { params }).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Recherche des trajets
     */
    search(query: string): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les trajets de l'utilisateur connecté
     */
    getMesTrajets(): Observable<Trajet[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/mes-trajets`).pipe(
            map((response) => response.data?.trajets || []),
            catchError(this.handleError)
        );
    }

    // ========== ÉCRITURE ==========

    /**
     * Crée un nouveau trajet
     */
    create(request: TrajetRequest): Observable<Trajet> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Met à jour un trajet
     */
    update(uuid: string, request: TrajetRequest): Observable<Trajet> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Met à jour les montants d'un trajet
     */
    updateMontants(uuid: string, montantBase: number, montantBagages?: number): Observable<Trajet> {
        let params = new HttpParams().set('montantBase', montantBase.toString());
        if (montantBagages !== undefined && montantBagages !== null) {
            params = params.set('montantBagages', montantBagages.toString());
        }

        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/montants`, {}, { params }).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Active un trajet
     */
    activate(uuid: string): Observable<Trajet> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/activer`, {}).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Désactive un trajet
     */
    deactivate(uuid: string): Observable<Trajet> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/desactiver`, {}).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Bascule le statut actif d'un trajet
     */
    toggleActif(uuid: string): Observable<Trajet> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/toggle-actif`, {}).pipe(
            map((response) => response.data?.trajet as Trajet),
            catchError(this.handleError)
        );
    }

    /**
     * Supprime un trajet
     */
    delete(uuid: string): Observable<void> {
        return this.http.delete<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            map(() => void 0),
            catchError(this.handleError)
        );
    }

    // ========== STATISTIQUES ==========

    /**
     * Récupère les statistiques des trajets
     */
    getStats(): Observable<TrajetStats> {
        return this.http.get<IResponse>(`${this.baseUrl}/stats`).pipe(
            map((response) => ({
                total: response.data?.total || 0,
                actifs: response.data?.actifs || 0,
                inactifs: response.data?.inactifs || 0
            })),
            catchError(this.handleError)
        );
    }

    // ========== GESTION DES ERREURS ==========

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('TrajetService Error:', httpErrorResponse);
        let error: string = 'Une erreur est survenue. Veuillez réessayer.';

        if (httpErrorResponse.error instanceof ErrorEvent) {
            error = `Erreur client - ${httpErrorResponse.error.message}`;
            return throwError(() => error);
        }

        if (httpErrorResponse.error?.message) {
            error = httpErrorResponse.error.message;
            return throwError(() => error);
        }

        switch (httpErrorResponse.status) {
            case 401:
                error = 'Session expirée. Veuillez vous reconnecter.';
                break;
            case 403:
                error = 'Accès non autorisé.';
                break;
            case 404:
                error = 'Trajet non trouvé.';
                break;
            case 409:
                error = 'Ce trajet existe déjà.';
                break;
            case 400:
                error = 'Données invalides.';
                break;
        }

        return throwError(() => error);
    };
}
