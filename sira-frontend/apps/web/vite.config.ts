import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Le proxy de dev reproduit le nginx de prod : les appels API partent en
 * same-origin vers le dev server, qui les relaie au gateway local (:9000).
 * Avantage : aucun problème CORS (le gateway n'autorise que 3000/4200/4202),
 * et le code applicatif utilise des chemins relatifs comme en production.
 */
const GATEWAY = 'http://localhost:9000';
const AUTH_SERVER = 'http://localhost:8090';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/billetterie': GATEWAY,
            '/user': GATEWAY,
            '/immo': GATEWAY,
            '/notification': GATEWAY,
            // Écart dev/prod connu : en prod l'auth server a le context-path
            // /authorization, en dev non. Le gateway ne retire pas le préfixe,
            // donc en dev on joint l'auth server en direct en le retirant ici.
            '/authorization': {
                target: AUTH_SERVER,
                rewrite: (path) => path.replace(/^\/authorization/, '')
            }
        }
    }
});
