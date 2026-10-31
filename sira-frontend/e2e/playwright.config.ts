import { defineConfig } from '@playwright/test';

/**
 * Tests de bout en bout du web React. Nés comme suite de parité contre
 * l'ancien frontend Angular, ils en sont devenus la spécification exécutable ;
 * l'Angular a été retiré le 2026-10-31 une fois la parité atteinte.
 *
 *   E2E_BASE_URL=http://localhost:5173 npm run test:e2e     (dev local, défaut)
 *   E2E_BASE_URL=https://test.synergia-guinee.com npm run test:e2e
 *
 * Les parcours connectés exigent E2E_EMAIL / E2E_PASSWORD d'un compte
 * SUPER_ADMIN propriétaire des véhicules de test.
 */
export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    retries: 1,
    use: {
        baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:5173',
        locale: 'fr-FR',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    reporter: [['list'], ['html', { open: 'never' }]]
});
