import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';

@Injectable({
    providedIn: 'root'
})
export class UserAdminService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/user`;

    constructor() {}

    getAllUsers$ = (): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}/list`).pipe(tap(console.log), catchError(this.handleError));

    getRoles$ = (): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}/roles`).pipe(tap(console.log), catchError(this.handleError));

    updateUserRole$ = (userUuid: string, role: string): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/${userUuid}/role`, { role }).pipe(tap(console.log), catchError(this.handleError));

    private handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.error('UserAdminService Error:', httpErrorResponse);
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
            error = 'Utilisateur non trouvé.';
        }

        return throwError(() => error);
    };
}
