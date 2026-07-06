import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';

export interface IOnboardingAgenceRequest {
    nom: string;
    raisonSociale?: string;
    numeroRegistre: string; // RCCM ou NIF
    adresse: string;
    communeId: number;
    regionId: number;
    email: string;
    telephone: string;
    telephoneWhatsapp?: string;
    description?: string;
}

/**
 * Onboarding des agences immobilières (rôle ADMIN_IMMO).
 * Statuts : PROFIL_INCOMPLET | EN_ATTENTE | EN_VALIDATION | VERIFIE | REJETE.
 */
@Injectable({ providedIn: 'root' })
export class AgenceOnboardingService {
    private http = inject(HttpClient);
    private baseUrl = `${server}/immo/agences/onboarding`;

    getMe$ = (): Observable<IResponse> => this.http.get<IResponse>(`${this.baseUrl}/me`).pipe(catchError(this.handleError));

    save$ = (request: IOnboardingAgenceRequest): Observable<IResponse> => this.http.put<IResponse>(this.baseUrl, request).pipe(tap(console.log), catchError(this.handleError));

    uploadRccm$ = (file: File): Observable<IResponse> => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<IResponse>(`${this.baseUrl}/rccm`, formData).pipe(catchError(this.handleError));
    };

    soumettre$ = (): Observable<IResponse> => this.http.post<IResponse>(`${this.baseUrl}/soumettre`, {}).pipe(catchError(this.handleError));

    private handleError(error: any): Observable<never> {
        console.error(error);
        const message = error?.error?.message || error?.message || 'Une erreur est survenue';
        return throwError(() => message);
    }
}
