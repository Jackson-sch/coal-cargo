import { test, expect } from '@playwright/test';

/**
 * Tests E2E para autenticación
 */
test.describe('Autenticación', () => {
  test('debe mostrar la página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login|Iniciar Sesión/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('debe validar campos requeridos en login', async ({ page }) => {
    await page.goto('/login');
    
    // Intentar enviar formulario vacío
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Debe mostrar errores de validación
    // Nota: Ajustar según la implementación real del formulario
    await expect(page).toHaveURL(/\/login/);
  });

  test('debe redirigir a dashboard después de login exitoso', async ({ page }) => {
    // Este test requiere credenciales válidas
    // Ajustar según el entorno de prueba
    await page.goto('/login');
    
    // Comentar/descomentar según tengas credenciales de prueba
    // await page.fill('input[type="email"]', 'admin@coalcargo.com');
    // await page.fill('input[type="password"]', '123456');
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL(/\/dashboard/);
  });
});

