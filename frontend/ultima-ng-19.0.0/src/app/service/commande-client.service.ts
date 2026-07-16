import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { CommandeClient, CommandeCreateRequest } from '@/interface/commande.model';

/**
 * Réservations de voyage côté client web (Phase C) — mêmes endpoints que le
 * mobile : création de commande, mes commandes, annulation.
 */
@Injectable({
    providedIn: 'root'
})
export class CommandeClientService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/commandes`;

    creer(request: CommandeCreateRequest): Observable<CommandeClient> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            map((response) => response.data?.commande as CommandeClient),
            catchError(this.handleError)
        );
    }

    mesCommandes(): Observable<CommandeClient[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/mes-commandes`).pipe(
            map((response) => (response.data?.commandes as CommandeClient[]) || []),
            catchError(this.handleError)
        );
    }

    getByUuid(uuid: string): Observable<CommandeClient> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            map((response) => response.data?.commande as CommandeClient),
            catchError(this.handleError)
        );
    }

    annuler(uuid: string): Observable<CommandeClient> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}/annuler`, {}).pipe(
            map((response) => response.data?.commande as CommandeClient),
            catchError(this.handleError)
        );
    }

    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        let error: string = 'Une erreur est survenue. Veuillez réessayer.';

        if (httpErrorResponse.error instanceof ErrorEvent) {
            return throwError(() => `Erreur client - ${httpErrorResponse.error.message}`);
        }
        if (httpErrorResponse.error?.message) {
            return throwError(() => httpErrorResponse.error.message);
        }
        if (httpErrorResponse.status === 401) {
            error = 'Session expirée. Veuillez vous reconnecter.';
        } else if (httpErrorResponse.status === 403) {
            error = 'Accès non autorisé.';
        } else if (httpErrorResponse.status === 404) {
            error = 'Commande non trouvée.';
        }
        return throwError(() => error);
    };
}
