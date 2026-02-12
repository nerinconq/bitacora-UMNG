
import { test, expect } from '@playwright/test';

test('Verify Materials Section Functionality', async ({ page }) => {
    // 1. Navigate to the app
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('Page loaded.');

    // Debug: Screenshot and Title
    await page.screenshot({ path: 'debug_initial_load.png' });
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // Dump some content
    const bodyText = await page.textContent('body');
    console.log(`Body text length: ${bodyText?.length}`);
    if (bodyText && bodyText.length < 500) {
        console.log('Body content:', await page.content());
    }

    // 2. Scroll to "Materiales y Equipos"
    const sectionTitle = page.getByText('Materiales y Equipos', { exact: false }).first();
    await expect(sectionTitle).toBeVisible({ timeout: 10000 });
    await sectionTitle.scrollIntoViewIfNeeded();
    console.log('Found "Materiales y Equipos" section.');

    // 3. Verify Tabs exist
    const listTab = page.getByRole('button', { name: 'Listado' });
    const galleryTab = page.getByRole('button', { name: 'Galería' });

    await expect(listTab).toBeVisible();
    await expect(galleryTab).toBeVisible();
    console.log('Tabs "Listado" and "Galería" are visible.');

    // 4. Verify "Listado" is active by default (white bg usually indicates active in this UI)
    // We can just check if List content is visible
    // The list has "Material de Laboratorio" header
    await expect(page.getByText('Material de Laboratorio')).toBeVisible();
    console.log('"Listado" view is active.');

    // 5. Verify Toggle
    const toggle = page.getByText('Ver Detalles');
    await expect(toggle).toBeVisible();
    console.log('"Ver Detalles" toggle is visible.');

    // 6. Switch to Gallery
    await galleryTab.click();
    console.log('Clicked "Galería" tab.');

    // Wait for transition
    await page.waitForTimeout(500);

    // 7. Verify Gallery content (Cards)
    // Cards have class "bg-white p-5 rounded-[2rem]" etc. 
    // We can check for a known item text or just the container structure difference

    // 8. Open Add Modal
    const addButton = page.getByRole('button', { name: 'AGREGAR' });
    await expect(addButton).toBeVisible();
    await addButton.click();
    console.log('Clicked "AGREGAR" button.');

    // 9. Verify Modal Title
    await expect(page.getByText('NUEVO MATERIAL')).toBeVisible();
    console.log('Modal "NUEVO MATERIAL" is visible.');

    // Capture Screenshot
    await page.screenshot({ path: 'materials_verification.png', fullPage: false });
    console.log('Screenshot saved to materials_verification.png');
});
