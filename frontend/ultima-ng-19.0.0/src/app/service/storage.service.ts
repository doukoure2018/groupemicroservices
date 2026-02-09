import { Key } from '@/enum/cache.key';
import { Inject, Injectable, InjectionToken } from '@angular/core';

const CLIENT_STORAGE = new InjectionToken<Storage>('CLIENT_STORAGE', { factory: () => localStorage });

@Injectable()
export class StorageService {
    constructor(@Inject(CLIENT_STORAGE) private storage: Storage) {}
    get = (key: string): any => {
        try {
            const item = this.storage.getItem(key);
            if (item === null) {
                return null; // Clé n'existe pas
            }
            // Essayer de parser le JSON, sinon retourner la string brute
            try {
                return JSON.parse(item);
            } catch {
                return item; // Si ce n'est pas du JSON, retourner la string
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du storage:', error);
            return null;
        }
    };

    set = (key: string, value: any) => {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            this.storage.setItem(key, stringValue);
        } catch (error) {
            console.error("Erreur lors de l'écriture dans le storage:", error);
        }
    };

    remove = (key: string) => this.storage.removeItem(key);

    // CORRECTION : Utiliser la nouvelle méthode get
    getRedirectUrl = (): string => this.get(Key.REDIRECT_URL) || '';

    setRedirectUrl = (redirect_url: string) => this.set(Key.REDIRECT_URL, redirect_url);

    removeRedirectUrl = () => this.remove(Key.REDIRECT_URL);
}
