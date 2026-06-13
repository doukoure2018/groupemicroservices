import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { ITraiterLeadRequest } from '@/interface/lead';

/**
 * Back-office intermédiation (Phase 1) — leads contact/visite.
 * Endpoints sécurisés ADMIN_BACKOFFICE/SUPER_ADMIN côté immobilierservice.
 * Le token est injecté par l'interceptor HTTP global.
 */
@Injectable({
    providedIn: 'root'
})
export class ImmobilierLeadsService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/immo/admin`;

    getContacts$ = (statut: string = 'NOUVEAU', limit: number = 50, offset: number = 0): Observable<IResponse> => {
        const params = new HttpParams().set('statut', statut).set('limit', limit).set('offset', offset);
        return this.http.get<IResponse>(`${this.baseUrl}/contacts`, { params }).pipe(catchError(this.handleError));
    };

    getVisites$ = (statut: string = 'NOUVEAU', limit: number = 50, offset: number = 0): Observable<IResponse> => {
        const params = new HttpParams().set('statut', statut).set('limit', limit).set('offset', offset);
        return this.http.get<IResponse>(`${this.baseUrl}/visites`, { params }).pipe(catchError(this.handleError));
    };

    traiterContact$ = (contactUuid: string, request: ITraiterLeadRequest): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/contacts/${contactUuid}`, request).pipe(catchError(this.handleError));

    traiterVisite$ = (visiteUuid: string, request: ITraiterLeadRequest): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/visites/${visiteUuid}`, request).pipe(catchError(this.handleError));

    /** Détail complet de l'annonce liée à un lead (endpoint public GET /immo/proprietes/{uuid}). */
    getProprieteDetail$ = (proprieteUuid: string): Observable<IResponse> =>
        this.http.get<IResponse>(`${server}/immo/proprietes/${proprieteUuid}`).pipe(catchError(this.handleError));

    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        let error = 'Une erreur est survenue. Veuillez réessayer.';
        if (httpErrorResponse.error instanceof ErrorEvent) {
            error = `Erreur client - ${httpErrorResponse.error.message}`;
        } else if (httpErrorResponse.error?.message) {
            error = httpErrorResponse.error.message;
        } else if (httpErrorResponse.error?.error) {
            error = httpErrorResponse.error.error;
        }
        return throwError(() => error);
    };
}
