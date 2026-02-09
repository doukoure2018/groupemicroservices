import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { TypeVehicule, TypeVehiculeRequest, TypeVehiculeStats } from '@/interface/type-vehicule.model';

@Injectable({
    providedIn: 'root'
})
export class TypeVehiculeService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/types-vehicules`;

    // ========== LECTURE ==========

    getAll(): Observable<TypeVehicule[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.typesVehicules || []),
            catchError(this.handleError)
        );
    }

    getAllActifs(): Observable<TypeVehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.typesVehicules || []),
            catchError(this.handleError)
        );
    }

    getByUuid(uuid: string): Observable<TypeVehicule> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    getByLibelle(libelle: string): Observable<TypeVehicule> {
        return this.http.get<IResponse>(`${this.baseUrl}/libelle/${libelle}`).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    getByCapacite(capacite: number): Observable<TypeVehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/capacite/${capacite}`).pipe(
            tap(console.log),
            map((response) => response.data?.typesVehicules || []),
            catchError(this.handleError)
        );
    }

    search(query: string): Observable<TypeVehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.typesVehicules || []),
            catchError(this.handleError)
        );
    }

    // ========== ÉCRITURE ==========

    create(request: TypeVehiculeRequest): Observable<TypeVehicule> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    update(uuid: string, request: TypeVehiculeRequest): Observable<TypeVehicule> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    activate(uuid: string): Observable<TypeVehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/activer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    deactivate(uuid: string): Observable<TypeVehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/desactiver`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    toggleActif(uuid: string): Observable<TypeVehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/toggle-actif`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.typeVehicule as TypeVehicule),
            catchError(this.handleError)
        );
    }

    delete(uuid: string): Observable<void> {
        return this.http.delete<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map(() => void 0),
            catchError(this.handleError)
        );
    }

    // ========== STATISTIQUES ==========

    getStats(): Observable<TypeVehiculeStats> {
        return this.http.get<IResponse>(`${this.baseUrl}/stats`).pipe(
            tap(console.log),
            map((response) => ({
                total: response.data?.total || 0,
                actifs: response.data?.actifs || 0,
                inactifs: response.data?.inactifs || 0
            })),
            catchError(this.handleError)
        );
    }

    // ========== ERREURS ==========

    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('TypeVehiculeService Error:', error);
        let message = 'Une erreur est survenue. Veuillez réessayer.';

        if (error.error instanceof ErrorEvent) {
            message = `Erreur client - ${error.error.message}`;
        } else if (error.error?.message) {
            message = error.error.message;
        } else {
            switch (error.status) {
                case 401:
                    message = 'Session expirée. Veuillez vous reconnecter.';
                    break;
                case 403:
                    message = 'Accès non autorisé.';
                    break;
                case 404:
                    message = 'Type de véhicule non trouvé.';
                    break;
                case 409:
                    message = 'Ce type de véhicule existe déjà.';
                    break;
            }
        }

        return throwError(() => message);
    };
}
