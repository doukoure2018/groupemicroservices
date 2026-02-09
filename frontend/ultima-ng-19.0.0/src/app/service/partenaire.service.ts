import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Partenaire, PartenaireRequest } from '@/interface/partenaire.model';

@Injectable({
    providedIn: 'root'
})
export class PartenaireService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/partenaires`;

    // ========== LECTURE ==========

    getAll(): Observable<Partenaire[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getAllActifs(): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/actifs`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getByUuid(uuid: string): Observable<Partenaire> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    getByNom(nom: string): Observable<Partenaire> {
        return this.http.get<IResponse>(`${this.baseUrl}/nom/${nom}`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    getByType(typePartenaire: string): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/type/${typePartenaire}`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getByStatut(statut: string): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/statut/${statut}`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getByVille(villeUuid: string): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getByRegion(regionUuid: string): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/region/${regionUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    search(query: string): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getPartenariatsExpires(): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/expires`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    getPartenariatsExpirantBientot(): Observable<Partenaire[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/expirant-bientot`).pipe(
            tap(console.log),
            map((response) => response.data?.partenaires || []),
            catchError(this.handleError)
        );
    }

    calculerCommission(uuid: string, montant: number): Observable<{ montantBrut: number; commission: number; montantNet: number }> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}/calculer-commission`, { params: { montant: montant.toString() } }).pipe(
            tap(console.log),
            map((response) => ({
                montantBrut: response.data?.montantBrut || 0,
                commission: response.data?.commission || 0,
                montantNet: response.data?.montantNet || 0
            })),
            catchError(this.handleError)
        );
    }

    // ========== ÉCRITURE ==========

    create(request: PartenaireRequest): Observable<Partenaire> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    update(uuid: string, request: PartenaireRequest): Observable<Partenaire> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    updateStatut(uuid: string, statut: string): Observable<Partenaire> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/statut`, {}, { params: { statut } }).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    updateCommissions(uuid: string, commissionPourcentage?: number, commissionFixe?: number): Observable<Partenaire> {
        let params = new HttpParams();
        if (commissionPourcentage !== undefined && commissionPourcentage !== null) {
            params = params.set('commissionPourcentage', commissionPourcentage.toString());
        }
        if (commissionFixe !== undefined && commissionFixe !== null) {
            params = params.set('commissionFixe', commissionFixe.toString());
        }

        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/commissions`, {}, { params }).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    activer(uuid: string): Observable<Partenaire> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/activer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    desactiver(uuid: string): Observable<Partenaire> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/desactiver`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    suspendre(uuid: string): Observable<Partenaire> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/suspendre`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
            catchError(this.handleError)
        );
    }

    mettreEnAttente(uuid: string): Observable<Partenaire> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/en-attente`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.partenaire as Partenaire),
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
                suspendus: response.data?.suspendus || 0,
                enAttente: response.data?.enAttente || 0
            })),
            catchError(this.handleError)
        );
    }

    getStatsByType(): Observable<any> {
        return this.http.get<IResponse>(`${this.baseUrl}/stats/types`).pipe(
            tap(console.log),
            map((response) => response.data),
            catchError(this.handleError)
        );
    }

    // ========== ERREURS ==========

    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('PartenaireService Error:', error);
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
                    message = 'Partenaire non trouvé.';
                    break;
                case 409:
                    message = 'Ce partenaire existe déjà.';
                    break;
            }
        }

        return throwError(() => message);
    };
}
