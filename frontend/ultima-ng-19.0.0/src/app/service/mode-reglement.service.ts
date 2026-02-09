import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { ModeReglement, ModeReglementRequest } from '@/interface/mode-reglement.model';

@Injectable({
    providedIn: 'root'
})
export class ModeReglementService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/modes-reglement`;

    // ========== LECTURE ==========

    getAll(): Observable<ModeReglement[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.modesReglement || []),
            catchError(this.handleError)
        );
    }

    getAllActifs(): Observable<ModeReglement[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.modesReglement || []),
            catchError(this.handleError)
        );
    }

    getByUuid(uuid: string): Observable<ModeReglement> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    getByCode(code: string): Observable<ModeReglement> {
        return this.http.get<IResponse>(`${this.baseUrl}/code/${code}`).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    getSansFrais(): Observable<ModeReglement[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/sans-frais`).pipe(
            tap(console.log),
            map((response) => response.data?.modesReglement || []),
            catchError(this.handleError)
        );
    }

    search(query: string): Observable<ModeReglement[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.modesReglement || []),
            catchError(this.handleError)
        );
    }

    calculerFrais(uuid: string, montant: number): Observable<{ montant: number; frais: number; total: number }> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}/calculer-frais`, { params: { montant: montant.toString() } }).pipe(
            tap(console.log),
            map((response) => ({
                montant: response.data?.montant || 0,
                frais: response.data?.frais || 0,
                total: response.data?.total || 0
            })),
            catchError(this.handleError)
        );
    }

    // ========== ÉCRITURE ==========

    create(request: ModeReglementRequest): Observable<ModeReglement> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    update(uuid: string, request: ModeReglementRequest): Observable<ModeReglement> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    updateFrais(uuid: string, fraisPourcentage?: number, fraisFixe?: number): Observable<ModeReglement> {
        let params = new HttpParams();
        if (fraisPourcentage !== undefined && fraisPourcentage !== null) {
            params = params.set('fraisPourcentage', fraisPourcentage.toString());
        }
        if (fraisFixe !== undefined && fraisFixe !== null) {
            params = params.set('fraisFixe', fraisFixe.toString());
        }

        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/frais`, {}, { params }).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    activate(uuid: string): Observable<ModeReglement> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/activer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    deactivate(uuid: string): Observable<ModeReglement> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/desactiver`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
            catchError(this.handleError)
        );
    }

    toggleActif(uuid: string): Observable<ModeReglement> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/toggle-actif`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.modeReglement as ModeReglement),
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

    getStats(): Observable<{ total: number; actifs: number; inactifs: number }> {
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
        console.error('ModeReglementService Error:', error);
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
                    message = 'Mode de règlement non trouvé.';
                    break;
                case 409:
                    message = 'Ce code existe déjà.';
                    break;
            }
        }

        return throwError(() => message);
    };
}
