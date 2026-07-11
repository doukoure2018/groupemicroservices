import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { IRejeterRequest } from '@/interface/propriete';

@Injectable({
    providedIn: 'root'
})
export class ImmobilierModerationService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/immo/proprietes`;

    findEnAttenteModeration$ = (limit: number = 20, offset: number = 0): Observable<IResponse> => {
        const params = new HttpParams().set('limit', limit).set('offset', offset);
        return this.http.get<IResponse>(`${this.baseUrl}/moderation`, { params }).pipe(catchError(this.handleError));
    };

    getForModeration$ = (proprieteUuid: string): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}/moderation/${proprieteUuid}`).pipe(catchError(this.handleError));

    valider$ = (proprieteUuid: string): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/${proprieteUuid}/valider`, {}).pipe(catchError(this.handleError));

    rejeter$ = (proprieteUuid: string, request: IRejeterRequest): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/${proprieteUuid}/rejeter`, request).pipe(catchError(this.handleError));

    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.log(httpErrorResponse);
        let error = 'Une erreur est survenue. Veuillez réessayer.';
        if (httpErrorResponse.error instanceof ErrorEvent) {
            error = `Erreur client - ${httpErrorResponse.error.message}`;
            return throwError(() => error);
        }
        if (httpErrorResponse.error?.message) {
            error = httpErrorResponse.error.message;
            return throwError(() => error);
        }
        if (httpErrorResponse.error?.error) {
            error = httpErrorResponse.error.error;
            return throwError(() => error);
        }
        return throwError(() => error);
    };
}
