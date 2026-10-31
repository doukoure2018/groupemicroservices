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

/**
 * Origine acceptée par la config CORS de tous les services locaux (billetterie,
 * user, immo, auth, gateway). Le navigateur ajoute un en-tête Origin sur les
 * requêtes d'écriture même en same-origin ; sans réécriture, le backend répond
 * « Invalid CORS request » (403).
 *
 * La valeur est encore l'ancien port de l'Angular, retiré le 2026-10-31 : les
 * six listes CORS backend et les redirect_uris du client OAuth2 (migration
 * V38) ne connaissent que celle-là. Y inscrire http://localhost:5173 puis
 * supprimer cette réécriture est une tâche à part, car elle touche la
 * configuration de sécurité de six services et demande une migration.
 */
const ORIGINE_LOCALE_AUTORISEE = 'http://localhost:4202';

/**
 * SIRA_API_DISTANTE=https://api-test.synergia-guinee.com fait pointer le proxy vers
 * un backend déployé (test ou prod) : utile pour vérifier le code local contre
 * de vraies données sans lancer la pile Spring. Là-bas, l'auth server est servi
 * derrière nginx sous /authorization, donc le préfixe est conservé.
 */
const distant = process.env['SIRA_API_DISTANTE'];

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: distant
            ? Object.fromEntries(['/billetterie', '/user', '/immo', '/notification', '/authorization'].map((p) => [
                      p,
                      {
                          target: distant,
                          changeOrigin: true,
                          secure: true,
                          // L'auth server distant juge l'Origin : on se présente comme le site lui-même.
                          configure: (proxy) =>
                              proxy.on('proxyReq', (req) => {
                                  req.setHeader('origin', distant);
                                  req.setHeader('referer', `${distant}/`);
                              })
                      }
                  ]))
            : {
                  ...Object.fromEntries(
                      ['/billetterie', '/user', '/immo', '/notification'].map((p) => [
                          p,
                          {
                              target: GATEWAY,
                              configure: (proxy) =>
                                  proxy.on('proxyReq', (req) => {
                                      req.setHeader('origin', ORIGINE_LOCALE_AUTORISEE);
                                      req.setHeader('referer', `${ORIGINE_LOCALE_AUTORISEE}/`);
                                  })
                          }
                      ])
                  ),
                  // Écart dev/prod connu : en prod l'auth server a le context-path
                  // /authorization, en dev non. Le gateway ne retire pas le préfixe,
                  // donc en dev on joint l'auth server en direct en le retirant ici.
                  '/authorization': {
                      target: AUTH_SERVER,
                      rewrite: (path) => path.replace(/^\/authorization/, ''),
                      configure: (proxy) =>
                          proxy.on('proxyReq', (req) => {
                              req.setHeader('origin', ORIGINE_LOCALE_AUTORISEE);
                              req.setHeader('referer', `${ORIGINE_LOCALE_AUTORISEE}/`);
                          })
                  }
              }
    }
});
