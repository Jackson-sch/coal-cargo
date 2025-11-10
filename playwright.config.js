import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Máximo tiempo para una prueba */
  timeout: 30 * 1000,
  expect: {
    /* Tiempo máximo para expect() */
    timeout: 5000,
  },
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* No ejecutar en CI por defecto */
  forbidOnly: !!process.env.CI,
  /* Reintentos en CI */
  retries: process.env.CI ? 2 : 0,
  /* Workers en CI vs local */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: 'html',
  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base para tests */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    /* Recopilar trace cuando se repite un test */
    trace: 'on-first-retry',
    /* Screenshots en caso de fallo */
    screenshot: 'only-on-failure',
  },

  /* Configurar proyectos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Descomentar para tests en otros navegadores
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Ejecutar servidor de desarrollo antes de los tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

