import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IResponse } from '@/interface/response';
import { Offre, OffreRequest, OffreStats } from '@/interface/offre.model';

@Injectable({
    providedIn: 'root'
})
export class OffreService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${server}/billetterie/offres`;

    // ========== LECTURE ==========

    /**
     * Récupère toutes les offres
     */
    getAll(): Observable<Offre[]> {
        return this.http.get<IResponse>(this.baseUrl).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres ouvertes (EN_ATTENTE, OUVERT)
     */
    getOuvertes(): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ouvertes`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère une offre par son UUID
     */
    getByUuid(uuid: string): Observable<Offre> {
        return this.http.get<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère une offre par son token
     */
    getByToken(token: string): Observable<Offre> {
        return this.http.get<IResponse>(`${this.baseUrl}/token/${token}`).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres de l'utilisateur connecté
     */
    getMesOffres(): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/mes-offres`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres par trajet
     */
    getByTrajet(trajetUuid: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/trajet/${trajetUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres par véhicule
     */
    getByVehicule(vehiculeUuid: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/vehicule/${vehiculeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres par statut
     */
    getByStatut(statut: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/statut/${statut}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres par date de départ
     */
    getByDate(dateDepart: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/date/${dateDepart}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Recherche avancée d'offres
     */
    rechercher(villeDepartUuid: string, villeArriveeUuid: string, dateDepart?: string): Observable<Offre[]> {
        let params = new HttpParams()
            .set('villeDepartUuid', villeDepartUuid)
            .set('villeArriveeUuid', villeArriveeUuid);

        if (dateDepart) {
            params = params.set('dateDepart', dateDepart);
        }

        return this.http.get<IResponse>(`${this.baseUrl}/recherche`, { params }).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres par ville de départ
     */
    getByVilleDepart(villeUuid: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville-depart/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres par ville d'arrivée
     */
    getByVilleArrivee(villeUuid: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/ville-arrivee/${villeUuid}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres avec places disponibles
     */
    getByPlacesDisponibles(nombrePlaces: number): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/places-disponibles/${nombrePlaces}`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres d'aujourd'hui
     */
    getAujourdHui(): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/aujourd-hui`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres à venir
     */
    getAVenir(): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/a-venir`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres passées
     */
    getPassees(): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/passees`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les offres avec promotions
     */
    getPromotions(): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/promotions`).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    /**
     * Recherche textuelle d'offres
     */
    search(query: string): Observable<Offre[]> {
        return this.http.get<IResponse>(`${this.baseUrl}/search`, { params: { q: query } }).pipe(
            tap(console.log),
            map((response) => response.data?.offres || []),
            catchError(this.handleError)
        );
    }

    // ========== ÉCRITURE ==========

    /**
     * Crée une nouvelle offre
     */
    create(request: OffreRequest): Observable<Offre> {
        return this.http.post<IResponse>(this.baseUrl, request).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Met à jour une offre
     */
    update(uuid: string, request: OffreRequest): Observable<Offre> {
        return this.http.put<IResponse>(`${this.baseUrl}/${uuid}`, request).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Supprime une offre
     */
    delete(uuid: string): Observable<void> {
        return this.http.delete<IResponse>(`${this.baseUrl}/${uuid}`).pipe(
            tap(console.log),
            map(() => void 0),
            catchError(this.handleError)
        );
    }

    // ========== GESTION DES STATUTS ==========

    /**
     * Ouvre une offre
     */
    ouvrir(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/ouvrir`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Ferme une offre
     */
    fermer(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/fermer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Clôture une offre
     */
    cloturer(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/cloturer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Annule une offre
     */
    annuler(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/annuler`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Démarre le voyage
     */
    demarrer(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/demarrer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Termine le voyage
     */
    terminer(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/terminer`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Suspend une offre
     */
    suspendre(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/suspendre`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Reprend une offre suspendue
     */
    reprendre(uuid: string): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/reprendre`, {}).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    // ========== GESTION DES PROMOTIONS ==========

    /**
     * Applique une promotion
     */
    appliquerPromotion(uuid: string, montantPromotion: number): Observable<Offre> {
        return this.http.patch<IResponse>(`${this.baseUrl}/${uuid}/promotion`, {}, { params: { montantPromotion: montantPromotion.toString() } }).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    /**
     * Retire une promotion
     */
    retirerPromotion(uuid: string): Observable<Offre> {
        return this.http.delete<IResponse>(`${this.baseUrl}/${uuid}/promotion`).pipe(
            tap(console.log),
            map((response) => response.data?.offre as Offre),
            catchError(this.handleError)
        );
    }

    // ========== STATISTIQUES ==========

    /**
     * Récupère les statistiques globales
     */
    getStats(): Observable<OffreStats> {
        return this.http.get<IResponse>(`${this.baseUrl}/stats`).pipe(
            tap(console.log),
            map((response) => ({
                total: response.data?.total || 0,
                enAttente: response.data?.enAttente || 0,
                ouvertes: response.data?.ouvertes || 0,
                fermees: response.data?.fermees || 0,
                enCours: response.data?.enCours || 0,
                terminees: response.data?.terminees || 0,
                annulees: response.data?.annulees || 0,
                suspendues: response.data?.suspendues || 0,
                aujourd_hui: response.data?.aujourd_hui || 0
            })),
            catchError(this.handleError)
        );
    }

    /**
     * Récupère les statistiques de l'utilisateur connecté
     */
    getMesStats(): Observable<OffreStats> {
        return this.http.get<IResponse>(`${this.baseUrl}/mes-stats`).pipe(
            tap(console.log),
            map((response) => ({
                total: response.data?.total || 0,
                enAttente: response.data?.enAttente || 0,
                ouvertes: response.data?.ouvertes || 0,
                fermees: response.data?.fermees || 0,
                enCours: response.data?.enCours || 0,
                terminees: response.data?.terminees || 0,
                annulees: response.data?.annulees || 0,
                suspendues: response.data?.suspendues || 0,
                aujourd_hui: response.data?.aujourd_hui || 0
            })),
            catchError(this.handleError)
        );
    }

    // ========== GESTION DES ERREURS ==========

    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('OffreService Error:', error);
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
                    message = 'Offre non trouvée.';
                    break;
                case 409:
                    message = 'Cette offre existe déjà.';
                    break;
                case 400:
                    message = 'Données invalides.';
                    break;
            }
        }

        return throwError(() => message);
    };
}
