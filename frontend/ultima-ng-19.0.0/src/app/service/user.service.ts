import { inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { catchError, Observable, throwError } from 'rxjs';
import { tokenEndpoint, server } from '@/utils/fileutils';
import { Key } from '@/enum/cache.key';
import { IAuthentication } from '@/interface/IAuthentication';
import { IResponse } from '@/interface/response';
@Injectable()
export class UserService {
    private jwt = new JwtHelperService();
    private storage = inject(StorageService);
    private http = inject(HttpClient);

    constructor() {}

    register$ = (user: any) => <Observable<IResponse>>this.http.post<IResponse>(`${server}/user/register`, user).pipe(catchError(this.handleError));

    verifyAccountToken$ = (token: string) => <Observable<IResponse>>this.http.get<IResponse>(`${server}/user/verify/account?token=${token}`).pipe(catchError(this.handleError));

    // Web-bridge Phase 2 : vérifie + active le compte ET renvoie les tokens
    // (format generateTokens : access_token/refresh_token/id_token). Endpoint
    // authorizationserver via gateway (préfixe /authorization). Pas d'enveloppe IResponse.
    verifyMobile$ = (token: string) => <Observable<any>>this.http.post<any>(`${server}/authorization/api/auth/verify-mobile`, { token }).pipe(catchError(this.handleError));

    resetPassword$ = (form: FormData) => <Observable<IResponse>>this.http.post<IResponse>(`${server}/user/resetpassword`, form).pipe(catchError(this.handleError));

    verifyPasswordToken$ = (token: string) => <Observable<IResponse>>this.http.get<IResponse>(`${server}/user/verify/password?token=${token}`).pipe(catchError(this.handleError));

    createNewPassword$ = (request: { userUuid: string; token: string; password: string; confirmPassword: string }) =>
        <Observable<IResponse>>this.http.post<IResponse>(`${server}/user/resetpassword/reset`, request).pipe(catchError(this.handleError));

    validateCode$ = (form: FormData) => <Observable<IAuthentication>>this.http.post<IAuthentication>(tokenEndpoint, form).pipe(catchError(this.handleError));

    getInstanceUser$ = () => <Observable<IResponse>>this.http.get<IResponse>(`${server}/user/instanceUser`).pipe(catchError(this.handleError));

    profile$ = () => <Observable<IResponse>>this.http.get<IResponse>(`${server}/user/profile`).pipe(catchError(this.handleError));

    handleError = (httpErrorResponse: HttpErrorResponse): Observable<never> => {
        console.log(httpErrorResponse);
        let error: string = 'An error occurred. Please try again.';
        if (httpErrorResponse.error instanceof ErrorEvent) {
            error = `A client error occurred - ${httpErrorResponse.error.message}`;
            return throwError(() => error);
        }
        if (httpErrorResponse.error.message) {
            error = `${httpErrorResponse.error.message}`;
            return throwError(() => error);
        }
        if (httpErrorResponse.error.error) {
            error = `Please login in again`;
            return throwError(() => error);
        }
        return throwError(() => error);
    };

    /**
     *  Functionnaly for logout
     */
    logOut(): void {
        localStorage.removeItem(Key.TOKEN);
        localStorage.removeItem(Key.REFRESH_TOKEN);
    }

    isAuthenticated = (): boolean => {
        const token = this.storage.get(Key.TOKEN);

        // Vérifier si le token existe ET n'est pas expiré
        if (!token || token === '' || token === 'null' || token === 'undefined') {
            return false;
        }

        try {
            return !this.jwt.isTokenExpired(token);
        } catch (error) {
            console.error("Erreur lors de la vérification d'authentification:", error);
            return false;
        }
    };

    isTokenExpired = (): boolean => {
        const token = this.storage.get(Key.TOKEN);

        // Si pas de token ou token vide, considérer comme expiré
        if (!token || token === '' || token === 'null' || token === 'undefined') {
            return true;
        }

        try {
            const result = this.jwt.isTokenExpired(token);
            if (result instanceof Promise) {
                // If a Promise is returned, consider token as expired (or handle async if needed)
                console.warn('isTokenExpired returned a Promise, treating as expired.');
                return true;
            }
            return result;
        } catch (error) {
            console.error("Erreur lors de la vérification d'expiration du token:", error);
            return true; // En cas d'erreur, considérer comme expiré
        }
    };
}
