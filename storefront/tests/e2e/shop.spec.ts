import { test, expect } from '@playwright/test';
import { acceptCookies } from '../helpers/cookies';
import { BRAND_COPY } from '../fixtures/brand';


test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem('gm_cookie_consent', 'accepted');
  });
});

test.describe('1. Domovská stránka (Homepage)', () => {
  test('1. Mal by načítať domovskú stránku a overiť hlavný nadpis v Hero sekcii', async ({ page }) => {
    await page.goto('/');
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText(BRAND_COPY.heroTitle);
  });

  test('2. Mal by zobraziť logo a názov obchodu growmedica v hlavičke', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('#site-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('Medica');
  });

  test('3. Mal by zobraziť USP panel s benefitmi', async ({ page }) => {
    await page.goto('/');
    const uspBar = page.locator('.usp-bar');
    await expect(uspBar).toBeVisible();
    await expect(uspBar).toContainText('DÔVERYHODNOSŤ');
  });

  test('4. Mal by obsahovať hlavné navigačné odkazy na produkty a kategórie', async ({ page }) => {
    await page.goto('/');
    const isMobile = await page.locator('#mobile-nav-toggle').isVisible();
    if (isMobile) {
      await expect(page.locator('#mobile-nav-toggle')).toBeVisible();
    } else {
      const nav = page.locator('nav[aria-label="Hlavná navigácia"]');
      await expect(nav).toBeVisible();
      await expect(nav.locator('a[href="/produkty"]')).toBeVisible();
      await expect(nav.locator('a[href="/kolekcie"]')).toBeVisible();
      await expect(nav.locator('a[href="/balicky"]')).toBeVisible();
      await expect(page.locator('#category-mega-menu-trigger')).toBeVisible();
    }
  });

  test('5. Mal by obsahovať sekciu "Nakupujte podľa kategórie" s dynamickými kolekciami', async ({ page }) => {
    await page.goto('/');
    const categoriesSection = page.locator('section[aria-labelledby="categories-heading"]');
    await expect(categoriesSection).toBeVisible();
    await expect(categoriesSection.locator('a[href="/kolekcie/vitaminy-mineraly"]')).toBeVisible();
  });

  test('6. Mal by obsahovať sekciu "Obľúbené produkty"', async ({ page }) => {
    await page.goto('/');
    const featuredHeading = page.locator('#featured-heading');
    await expect(featuredHeading).toBeVisible();
    await expect(featuredHeading).toContainText('Najpredávanejšie produkty');
  });

  test('7. Mal by obsahovať sekciu "Prečo GrowMedica" so SEO popisom', async ({ page }) => {
    await page.goto('/');
    const aboutSection = page.locator('section[aria-label="O GrowMedica.sk"]');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection.locator('.why-growmedica__label')).toContainText(BRAND_COPY.aboutLabel);
    await expect(aboutSection.locator('h2')).toContainText(BRAND_COPY.aboutHeading);
    await expect(aboutSection.locator('.why-growmedica__slogan')).toContainText(BRAND_COPY.aboutSlogan);
    await expect(aboutSection.locator('.why-growmedica__glass.liquid-glass')).toBeVisible();
    await expect(aboutSection.locator('.why-growmedica__health-line')).toHaveCount(BRAND_COPY.aboutHealthLines.length);
  });

  test('7b. Mal by obsahovať sekciu balíčkov zdravia s odkazom na /balicky', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#bundles-heading')).toContainText(BRAND_COPY.bundlesHeading);
    await expect(page.locator('a[href="/balicky"]').filter({ visible: true }).first()).toBeVisible();
  });

  test('8. Mal by obsahovať pätičku (Footer) s logami platobných možností', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('text=VISA')).toBeVisible();
  });
});

test.describe('2. Navigácia a Statické Podstránky', () => {
  test('9. Mal by úspešne načítať podstránku "O nás"', async ({ page }) => {
    await page.goto('/o-nas');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(BRAND_COPY.aboutPageTitle);
  });

  test('10. Mal by úspešne načítať podstránku "Doprava a platba"', async ({ page }) => {
    await page.goto('/doprava-a-platba');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Doprava a platba');
  });

  test('10b. Mal by načítať stránku balíčkov zdravia', async ({ page }) => {
    await page.goto('/balicky');
    await expect(page.locator('h1')).toContainText(BRAND_COPY.bundlesHeading);
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText(BRAND_COPY.bundlesHeading);
    await expect(page.locator('.bundle-grid .bundle-card')).toHaveCount(63);
    await expect(page.locator('[data-has-shopify-product="true"]').first()).toBeVisible();
    await expect(page.getByTestId('bundle-add-to-cart').first()).toBeVisible();
  });

  test('11. Mal by úspešne načítať podstránku "Veľkoobchod"', async ({ page }) => {
    await page.goto('/velkoobchod');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/veľkoobchod/i);
  });

  test('12. Mal by úspešne načítať podstránku "Často kladené otázky (FAQ)"', async ({ page }) => {
    await page.goto('/faq');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Často kladené otázky');
  });

  test('13. Mal by úspešne načítať Obchodné podmienky', async ({ page }) => {
    await page.goto('/obchodne-podmienky');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Obchodné podmienky');
  });

  test('14. Mal by úspešne načítať Ochranu osobných údajov', async ({ page }) => {
    await page.goto('/ochrana-osobnych-udajov');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Ochrana osobných údajov');
  });

  test('15. Mal by úspešne načítať Reklamačný poriadok', async ({ page }) => {
    await page.goto('/reklamacny-poriadok');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Reklamačný poriadok');
  });

  test('16. Mal by načítať kontaktnú stránku a overiť jej hlavný nadpis a kontaktné údaje', async ({ page }) => {
    await page.goto('/kontakt');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Kontakt');
    await expect(page.locator('main').locator('text=info@growmedica.sk').first()).toBeVisible();
  });

  test('17. Mal by odoslať kontaktný formulár a zobraziť potvrdzujúcu hlášku (alert)', async ({ page }) => {
    await page.goto('/kontakt');
    await acceptCookies(page);

    await page.getByPlaceholder('Jozef Novák').fill('Testovací Používateľ');
    await page.getByPlaceholder('jozef@email.sk').fill('test@email.sk');
    await page.getByPlaceholder('Dobrý deň, chcel by som sa opýtať...').fill('Ahoj, toto je testovacia správa.');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Ďakujeme za vašu správu');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Odoslať správu' }).click();
  });
});

test.describe('3. Produkty a Kolekcie', () => {
  test('18. Mal by načítať celkový zoznam produktov (/produkty) a zobraziť aspoň jeden produkt', async ({ page }) => {
    await page.goto('/produkty');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Všetky produkty');
    
    const productCard = page.locator('article.product-card').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
  });

  test('19. Mal by načítať zoznam kolekcií (/kolekcie)', async ({ page }) => {
    await page.goto('/kolekcie');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Kolekcie produktov');
  });

  test('20. Mal by úspešne načítať konkrétnu kolekciu s produktmi', async ({ page }) => {
    await page.goto('/kolekcie/regeneracia');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Regeneračné doplnky');
    await expect(page.locator('article.product-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('21. Mal by pri neexistujúcej alebo prázdnej kolekcii zobraziť prázdny stav (EmptyState)', async ({ page }) => {
    await page.goto('/kolekcie/neexistujuca-kolekcia');
    const emptyState = page.locator('text=Stránka nebola nájdená');
    await expect(emptyState).toBeVisible();
  });

  test('22. Mal by načítať detail konkrétneho produktu a zobraziť jeho názov, cenu a popis', async ({ page }) => {
    await page.goto('/produkty');
    await acceptCookies(page);
    
    const firstProduct = page.locator('article.product-card').first();
    const productTitle = await firstProduct.locator('h3').innerText();
    
    await firstProduct.locator('a.btn-primary').click({ force: true });
    await expect(page).toHaveURL(/\/produkty\/.+/);
    
    const detailHeading = page.locator('h1');
    await expect(detailHeading).toBeVisible();
    await expect(detailHeading).toContainText(productTitle.substring(0, 10));
  });

  test('23. Mal by zobraziť stav zásob a výrobcu na detaile produktu', async ({ page }) => {
    await page.goto('/produkty');
    await acceptCookies(page);
    await page.locator('article.product-card').first().locator('a.btn-primary').click({ force: true });
    
    const detailContainer = page.locator('main').locator('div.space-y-6').first();
    await expect(detailContainer).toBeVisible();
    
    const badge = detailContainer.locator('.badge-success, .badge-error').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/(Dostupné skladom|Momentálne vypredané)/);
    await expect(detailContainer.locator('p.uppercase').first()).toBeVisible();
  });
});

test.describe('4. Vyhľadávanie', () => {
  test('24. Mal by načítať vyhľadávaciu stránku (/vyhladavanie) s formulárom', async ({ page }) => {
    await page.goto('/vyhladavanie');
    const heading = page.locator('h2');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Zadajte hľadaný výraz');
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test('25. Mal by vyhľadať reálny produkt (napr. "Cordyceps") a zobraziť výsledok', async ({ page }) => {
    await page.goto('/vyhladavanie');
    await acceptCookies(page);
    
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('Cordyceps');
    await searchInput.press('Enter');
    
    await expect(page).toHaveURL(/\/vyhladavanie\?q=Cordyceps/);
    const productCard = page.locator('article.product-card').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
  });

  test('26. Mal by zobraziť správny prázdny stav pri vyhľadaní neexistujúceho výrazu', async ({ page }) => {
    await page.goto('/vyhladavanie');
    await acceptCookies(page);
    
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('neexistujuci-vyraz-xyz');
    await searchInput.press('Enter');
    
    const emptyState = page.locator('text=Nič sme nenašli pre');
    await expect(emptyState).toBeVisible();
  });
});

test.describe('5. Košík a Nákupný Proces', () => {
  test('27. Mal by načítať prázdny košík a zobraziť informáciu, že je prázdny', async ({ page }) => {
    await page.goto('/kosik');
    const heading = page.locator('h2');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Košík je prázdny');
  });

  test('28. Mal by na detaile produktu zobraziť funkčné tlačidlo "Pridať do košíka"', async ({ page }) => {
    await page.goto('/produkty');
    await acceptCookies(page);
    await page.locator('article.product-card').first().locator('a.btn-primary').click({ force: true });
    
    const addToCartBtn = page.locator('#add-to-cart-btn');
    await expect(addToCartBtn).toBeVisible();
  });

  test('29. Mal by po kliknutí na "Pridať do košíka" aktualizovať počítadlo košíka v hlavičke', async ({ page }) => {
    await page.goto('/produkty');
    await acceptCookies(page);
    await page.locator('article.product-card').first().locator('a.btn-primary').click({ force: true });
    
    const addToCartBtn = page.locator('#add-to-cart-btn');
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click({ force: true });
    const cartBadge = page.locator('#cart-button span[aria-hidden="true"]');
    await expect(cartBadge).toHaveText('1');
  });

  test('30. Mal by pridať produkt do košíka, prejsť do košíka a zobraziť pridanú položku', async ({ page }) => {
    await page.goto('/produkty');
    await acceptCookies(page);
    
    const firstProduct = page.locator('article.product-card').first();
    const productTitle = await firstProduct.locator('h3').innerText();
    await firstProduct.locator('a.btn-primary').click({ force: true });
    
    const addToCartBtn = page.locator('#add-to-cart-btn');
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click({ force: true });
    
    const cartBadge = page.locator('#cart-button span[aria-hidden="true"]');
    await expect(cartBadge).toHaveText('1');
      
    await page.goto('/kosik');
      
    const cartItemTitle = page.locator('a[href^="/produkty/"]').first();
    // On mobile the cart items render in a single-column layout — scroll into view before asserting
    await cartItemTitle.scrollIntoViewIfNeeded();
    await expect(cartItemTitle).toBeVisible({ timeout: 10000 });
    await expect(cartItemTitle).toContainText(productTitle.substring(0, 10));
  });

  test('31. Mal by v košíku zobraziť súhrn objednávky a tlačidlo pre prechod k pokladni (checkout)', async ({ page }) => {
    await page.goto('/produkty');
    await acceptCookies(page);
    await page.locator('article.product-card').first().locator('a.btn-primary').click({ force: true });
    
    const addToCartBtn = page.locator('#add-to-cart-btn');
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click({ force: true });
    
    const cartBadge = page.locator('#cart-button span[aria-hidden="true"]');
    await expect(cartBadge).toHaveText('1');
      
    await page.goto('/kosik');
      
    // On mobile the order summary panel renders below the cart items (single-column layout).
    // Scroll each element into view before asserting visibility.
    const summaryHeading = page.locator('h2', { hasText: 'Súhrn nákupu' });
    await summaryHeading.scrollIntoViewIfNeeded();
    await expect(summaryHeading).toBeVisible({ timeout: 10000 });
      
    const checkoutBtn = page.locator('#checkout-btn');
    await checkoutBtn.scrollIntoViewIfNeeded();
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
  });
});
