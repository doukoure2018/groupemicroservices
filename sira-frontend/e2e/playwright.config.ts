import { defineConfig } from '@playwright/test';

/**
 * Suite de PARITÉ : ces tests s'exécutent contre le frontend Angular ACTUEL
 * (npm start dans frontend/ultima-ng-19.0.0 → http://localhost:4202) et servent
 * de spécification exécutable. Le futur frontend React devra les faire passer
 * à l'identique — il suffira de changer E2E_BASE_URL.
 *
 *   E2E_BASE_URL=http://localhost:4202 npm run test:e2e     (Angular actuel)
 *   E2E_BASE_URL=http://localhost:5173 npm run test:e2e     (React, plus tard)
 */
export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    retries: 1,
    use: {
        baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4202',
        locale: 'fr-FR',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    reporter: [['list'], ['html', { open: 'never' }]]
});
