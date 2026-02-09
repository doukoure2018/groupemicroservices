import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { server } from '@/utils/fileutils';
import { IPlacePrediction, IPlaceDetails } from '@/interface/localisation';
import { IResponse } from '@/interface/response';

/**
 * Service pour l'intégration avec OpenStreetMap via le proxy backend.
 * Utilise l'API Nominatim (100% gratuite, pas de clé API).
 */
@Injectable({
    providedIn: 'root'
})
export class OpenStreetMapService {
    private http = inject(HttpClient);

    // URL du proxy backend
    private readonly baseUrl = `${server}/billetterie/osm`;

    constructor() {}

    /**
     * Recherche d'adresses (autocomplete)
     * @param query Terme de recherche
     * @param country Code pays (défaut: gn pour Guinée)
     * @returns Observable avec la liste des suggestions
     */
    searchPlaces$ = (query: string, country: string = 'gn'): Observable<IPlacePrediction[]> => {
        if (!query || query.length < 2) {
            return of([]);
        }

        const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&country=${country}&limit=10`;

        return this.http.get<IResponse>(url).pipe(
            map((response) => {
                if (response.data?.predictions) {
                    return (response.data.predictions as any[]).map((p) => ({
                        placeId: p.placeId,
                        description: p.description,
                        latitude: p.latitude,
                        longitude: p.longitude,
                        type: p.type,
                        category: p.category
                    }));
                }
                return [];
            }),
            catchError((error) => {
                console.error('Erreur OpenStreetMap Search:', error);
                return of([]);
            })
        );
    };

    /**
     * Recherche spécifique en Guinée avec résultats améliorés
     * @param query Terme de recherche
     * @returns Observable avec la liste des suggestions
     */
    searchGuinea$ = (query: string): Observable<IPlacePrediction[]> => {
        if (!query || query.length < 2) {
            return of([]);
        }

        const url = `${this.baseUrl}/guinea?query=${encodeURIComponent(query)}&limit=10`;

        return this.http.get<IResponse>(url).pipe(
            map((response) => {
                if (response.data?.predictions) {
                    return (response.data.predictions as any[]).map((p) => ({
                        placeId: p.placeId,
                        description: p.description,
                        latitude: p.latitude,
                        longitude: p.longitude,
                        quartier: p.quartier,
                        commune: p.commune,
                        ville: p.ville,
                        region: p.region
                    }));
                }
                return [];
            }),
            catchError((error) => {
                console.error('Erreur OpenStreetMap Guinea:', error);
                return of([]);
            })
        );
    };

    /**
     * Récupère les détails d'un lieu par ses coordonnées (géocodage inverse)
     * @param lat Latitude
     * @param lng Longitude
     * @returns Observable avec les détails du lieu
     */
    getPlaceByCoordinates$ = (lat: number, lng: number): Observable<IPlaceDetails | null> => {
        if (!lat || !lng) {
            return of(null);
        }

        const url = `${this.baseUrl}/reverse?lat=${lat}&lng=${lng}`;

        return this.http.get<IResponse>(url).pipe(
            map((response) => {
                if (response.data?.place) {
                    const place = response.data.place as any;
                    return {
                        address: place.address || '',
                        latitude: place.latitude || lat,
                        longitude: place.longitude || lng
                    };
                }
                return null;
            }),
            catchError((error) => {
                console.error('Erreur OpenStreetMap Reverse:', error);
                return of(null);
            })
        );
    };

    /**
     * Génère l'URL pour afficher un lieu sur OpenStreetMap
     * @param lat Latitude
     * @param lng Longitude
     * @returns URL OpenStreetMap
     */
    getOpenStreetMapUrl(lat: number, lng: number): string {
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
    }

    /**
     * Génère l'URL pour l'iframe OpenStreetMap embed
     * @param lat Latitude
     * @param lng Longitude
     * @returns URL pour iframe
     */
    getMapEmbedUrl(lat: number, lng: number): string {
        // Utilise la bounding box pour centrer la carte
        const delta = 0.005; // Environ 500m autour du point
        const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    }

    /**
     * Génère l'URL pour l'image statique de la carte (via MapStatic)
     * Alternative gratuite aux images statiques Google Maps
     * @param lat Latitude
     * @param lng Longitude
     * @param width Largeur de l'image
     * @param height Hauteur de l'image
     * @returns URL de l'image
     */
    getStaticMapUrl(lat: number, lng: number, width: number = 400, height: number = 200): string {
        // Utilise osm-static-maps ou une alternative
        return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=${width}x${height}&markers=${lat},${lng},red`;
    }
}
