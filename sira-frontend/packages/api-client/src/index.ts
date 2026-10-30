export { SiraClient, ApiError } from './http.js';
export type { SiraClientConfig, TokenProvider, RequestOptions, QueryParams } from './http.js';
export * from './billetterie.js';
export * from './user.js';
export * from './immo.js';

import { SiraClient, type SiraClientConfig } from './http.js';
import { billetApi, commandeApi, commercialApi, geoApi, notificationApi, offreApi, transportApi, vehiculeApi } from './billetterie.js';
import { userApi } from './user.js';
import { agenceApi, immoClientApi, leadApi, proprieteApi } from './immo.js';

/** Fabrique l'API complète, prête à consommer côté React comme côté React Native. */
export function createSiraApi(config: SiraClientConfig) {
    const client = new SiraClient(config);
    return {
        client,
        geo: geoApi(client),
        transport: transportApi(client),
        offres: offreApi(client),
        commandes: commandeApi(client),
        billets: billetApi(client),
        vehicules: vehiculeApi(client),
        commercial: commercialApi(client),
        notifications: notificationApi(client),
        users: userApi(client),
        immo: {
            proprietes: proprieteApi(client),
            clientSide: immoClientApi(client),
            agences: agenceApi(client),
            leads: leadApi(client)
        }
    };
}

export type SiraApi = ReturnType<typeof createSiraApi>;
