import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
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
        this.http.get<IResponse>(`${this.baseUrl}/list`).pipe(catchError(this.handleError));

    getRoles$ = (): Observable<IResponse> =>
        this.http.get<IResponse>(`${this.baseUrl}/roles`).pipe(catchError(this.handleError));

    updateUserRole$ = (userUuid: string, role: string): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/${userUuid}/role`, { role }).pipe(catchError(this.handleError));

    /** Admin : crée un compte backoffice (rôle whitelisté, actif, mot de passe temporaire). */
    createBackofficeUser$ = (payload: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        password: string;
        roleName: string;
    }): Observable<IResponse> =>
        this.http.post<IResponse>(`${this.baseUrl}/admin/create`, payload).pipe(catchError(this.handleError));

    /** Admin : bloque/débloque un compte (toggle enabled). */
    toggleEnabled$ = (userUuid: string): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/${userUuid}/toggle-enabled`, {}).pipe(catchError(this.handleError));

    /** Admin : modifie un utilisateur ciblé (nom, prénom, email, téléphone). */
    updateUser$ = (userUuid: string, payload: { firstName: string; lastName: string; email: string; phone?: string }): Observable<IResponse> =>
        this.http.patch<IResponse>(`${this.baseUrl}/${userUuid}/update`, payload).pipe(catchError(this.handleError));

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
