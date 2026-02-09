import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Vehicule, VehiculeRequest } from '@/interface/vehicule.model';

@Injectable({
    providedIn: 'root'
})
export class VehiculeService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/vehicules`;

    // ========== LECTURE ==========

    getAll(): Observable<Vehicule[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getAllActifs(): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getByUuid(uuid: string): Observable<Vehicule> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    getByImmatriculation(immatriculation: string): Observable<Vehicule> {
        return this.http.get<IResponse>(`${this.baseUrl}/immatriculation/${immatriculation}`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    getMesVehicules(): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/mes-vehicules`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getByTypeVehicule(typeVehiculeUuid: string): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/type/${typeVehiculeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getByStatut(statut: string): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/statut/${statut}`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getByNombrePlacesMin(nombrePlaces: number): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/places-min/${nombrePlaces}`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getClimatises(): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/climatises`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getAssuranceExpiree(): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/assurance-expiree`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    getVisiteExpiree(): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/visite-expiree`).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    search(query: string): Observable<Vehicule[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.vehicules || []),
            catchError(this.handleError)
        );
    }

    // ========== ÉCRITURE ==========

    create(request: VehiculeRequest): Observable<Vehicule> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    update(uuid: string, request: VehiculeRequest): Observable<Vehicule> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    updateStatut(uuid: string, statut: string): Observable<Vehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/statut`, {}, { params: { statut } }).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    activer(uuid: string): Observable<Vehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/activer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    desactiver(uuid: string): Observable<Vehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/desactiver`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    mettreEnMaintenance(uuid: string): Observable<Vehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/maintenance`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
            catchError(this.handleError)
        );
    }

    suspendre(uuid: string): Observable<Vehicule> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/suspendre`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.vehicule as Vehicule),
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

    getStats(): Observable<any> {
        return this.http.get<IResponse>(`${this.baseUrl}/stats`).pipe(
            tap(console.log),
            map((response) => ({
                total: response.data?.total || 0,
                actifs: response.data?.actifs || 0,
                inactifs: response.data?.inactifs || 0,
                enMaintenance: response.data?.enMaintenance || 0,
                suspendus: response.data?.suspendus || 0
            })),
            catchError(this.handleError)
        );
    }

    getMesStats(): Observable<any> {
        return this.http.get<IResponse>(`${this.baseUrl}/mes-stats`).pipe(
            tap(console.log),
            map((response) => ({ total: response.data?.total || 0 })),
            catchError(this.handleError)
        );
    }

    // ========== ERREURS ==========

    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('VehiculeService Error:', error);
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
                    message = 'Véhicule non trouvé.';
                    break;
                case 409:
                    message = 'Cette immatriculation existe déjà.';
                    break;
            }
        }

        return throwError(() => message);
    };
}
