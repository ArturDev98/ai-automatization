import { defineConfig, devices } from '@playwright/test';

const UI_URL = process.env.UI_URL ?? 'https://practicesoftwaretesting.com';
const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';
const UI_BUGS_URL = process.env.UI_BUGS_URL ?? 'https://with-bugs.practicesoftwaretesting.com';

// Cada corrida aparte guarda su resultado con sufijo para no pisar el de la suite.
// Los workers recargan esta config sin los argumentos: el sufijo les llega por el entorno.
const aparte = ['ui-bugs', 'panel'].find((p) => process.argv.some((a) => a.includes(`--project=${p}`)));
process.env.PW_SUFIJO ??= aparte ? `-${aparte.replace('ui-', '')}` : '';
const sufijo = process.env.PW_SUFIJO;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // La app es de terceros: se reintenta solo en CI para no tapar inestabilidad en local.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // Carpeta propia por corrida: cada una limpia la suya y no borra las capturas de la anterior.
  outputDir: `test-results${sufijo}`,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `playwright-report${sufijo}` }],
    ['json', { outputFile: `results/results${sufijo}.json` }],
  ],
  use: {
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'ui', testDir: './tests/ui', use: { ...devices['Desktop Chrome'], baseURL: UI_URL } },
    { name: 'api', testDir: './tests/api', use: { baseURL: API_URL } },
    // Misma suite contra la versión con bugs sembrados; no corre por defecto.
    { name: 'ui-bugs', testDir: './tests/ui', use: { ...devices['Desktop Chrome'], baseURL: UI_BUGS_URL } },
    // El panel generado, abierto como archivo: no corre por defecto.
    { name: 'panel', testDir: './tests/panel', use: { ...devices['Desktop Chrome'] } },
  ],
});
