import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IPlacePrediction, IPlaceDetails } from '@/interface/localisation';
import { IResponse } from '@/interface/response';

/**
 * Service pour l'intégration avec Google Places API via le proxy backend.
 * Les appels passent par le backend pour éviter les problèmes CORS.
 */
@Injectable({
    providedIn: 'root'
})
export class GooglePlacesService {
    private http = inject(HttpClient);

    // URL du proxy backend
    private readonly baseUrl = `${server}/billetterie/google-places`;

    // Clé API Google (utilisée uniquement pour les URLs côté client comme Maps Embed)
    private readonly GOOGLE_API_KEY = 'AIzaSyAakQpxJmLcDXh8aKdMzt1kZCoNCQgKrLU';

    constructor() {}

    /**
     * Récupère les suggestions d'adresses basées sur une requête
     * Passe par le proxy backend pour éviter CORS
     * @param query Terme de recherche
     * @param country Code pays (défaut: gn pour Guinée)
     * @returns Observable avec la liste des suggestions
     */
    getAutocompleteSuggestions$ = (query: string, country: string = 'gn'): Observable<IPlacePrediction[]> => {
        if (!query || query.length < 3) {
            return of([]);
        }

        const url = `${this.baseUrl}/autocomplete?query=${encodeURIComponent(query)}&country=${country}`;

        return this.http.get<IResponse>(url).pipe(
            map((response) => {
                if (response.data?.predictions) {
                    return response.data.predictions as IPlacePrediction[];
                }
                return [];
            }),
            catchError((error) => {
                console.error('Erreur Autocomplete via proxy:', error);
                return of([]);
            })
        );
    };

    /**
     * Récupère les détails d'un lieu à partir de son placeId
     * Passe par le proxy backend pour éviter CORS
     * @param placeId Identifiant du lieu Google
     * @returns Observable avec les détails du lieu
     */
    getPlaceDetails$ = (placeId: string): Observable<IPlaceDetails | null> => {
        if (!placeId) {
            return of(null);
        }

        const url = `${this.baseUrl}/details?placeId=${encodeURIComponent(placeId)}`;

        return this.http.get<IResponse>(url).pipe(
            map((response) => {
                if (response.data?.place) {
                    const place = response.data.place as any;
                    if (place.address) {
                        return {
                            address: place.address,
                            latitude: place.latitude || 0,
                            longitude: place.longitude || 0
                        };
                    }
                }
                return null;
            }),
            catchError((error) => {
                console.error('Erreur Place Details via proxy:', error);
                return of(null);
            })
        );
    };

    /**
     * Récupère l'adresse à partir de coordonnées GPS (géocodage inverse)
     * Passe par le proxy backend pour éviter CORS
     * @param lat Latitude
     * @param lng Longitude
     * @returns Observable avec l'adresse formatée
     */
    getAddressFromCoordinates$ = (lat: number, lng: number): Observable<string | null> => {
        if (!lat || !lng) {
            return of(null);
        }

        const url = `${this.baseUrl}/geocode?lat=${lat}&lng=${lng}`;

        return this.http.get<IResponse>(url).pipe(
            map((response) => {
                if (response.data?.address) {
                    return response.data.address as string;
                }
                return null;
            }),
            catchError((error) => {
                console.error('Erreur Geocoding via proxy:', error);
                return of(null);
            })
        );
    };

    /**
     * Génère l'URL pour afficher un lieu sur Google Maps
     * @param lat Latitude
     * @param lng Longitude
     * @returns URL Google Maps
     */
    getGoogleMapsUrl(lat: number, lng: number): string {
        return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    /**
     * Génère l'URL pour l'iframe Google Maps embed
     * Note: Cette URL peut être utilisée directement car l'iframe est chargée par le navigateur
     * @param lat Latitude
     * @param lng Longitude
     * @returns URL pour iframe
     */
    getGoogleMapsEmbedUrl(lat: number, lng: number): string {
        return `https://www.google.com/maps/embed/v1/place?key=${this.GOOGLE_API_KEY}&q=${lat},${lng}&zoom=15`;
    }

    /**
     * Génère l'URL pour l'image statique Google Maps
     * @param lat Latitude
     * @param lng Longitude
     * @param width Largeur de l'image
     * @param height Hauteur de l'image
     * @returns URL de l'image
     */
    getStaticMapUrl(lat: number, lng: number, width: number = 400, height: number = 200): string {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${this.GOOGLE_API_KEY}`;
    }
}
