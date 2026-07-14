import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const PRODUCTS_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/produkty/page.tsx')
const PRODUCT_DETAIL_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/produkty/[handle]/page.tsx')
const WISHLIST_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/oblubene/page.tsx')
const LOGIN_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/prihlasenie/page.tsx')
const PROFILE_PAGE_PATH = path.join(REPO_ROOT, 'storefront/src/app/profil/page.tsx')

const FILTER_LIST_PATH = path.join(REPO_ROOT, 'storefront/src/components/product/FilterableProductList.tsx')
const WISHLIST_BTN_PATH = path.join(REPO_ROOT, 'storefront/src/components/product/WishlistButton.tsx')
const REVIEWS_PATH = path.join(REPO_ROOT, 'storefront/src/components/product/ProductReviews.tsx')

test.describe('Customer Experience Features - Static Integrity Tests', () => {

  test('1. Pokročilé filtrovanie na /produkty', () => {
    // Verify produkty page imports and renders FilterableProductList
    expect(existsSync(PRODUCTS_PAGE_PATH)).toBe(true)
    const pageContent = readFileSync(PRODUCTS_PAGE_PATH, 'utf8')
    expect(pageContent).toContain('FilterableProductList')
    expect(pageContent).toContain('<FilterableProductList')

    // Verify FilterableProductList implements advanced filtering UI elements
    expect(existsSync(FILTER_LIST_PATH)).toBe(true)
    const filterContent = readFileSync(FILTER_LIST_PATH, 'utf8')
    expect(filterContent).toContain('searchQuery')
    expect(filterContent).toContain('priceRange')
    expect(filterContent).toContain('selectedVendors')
    expect(filterContent).toContain('selectedTypes')
    expect(filterContent).toContain('selectedTags')
    expect(filterContent).toContain('sortBy')
    expect(filterContent).toContain('clearAllFilters')
  })

  test('2. Wishlist - Srdiečka a stránka obľúbených', () => {
    // Verify WishlistButton is implemented and uses correct localStorage key
    expect(existsSync(WISHLIST_BTN_PATH)).toBe(true)
    const btnContent = readFileSync(WISHLIST_BTN_PATH, 'utf8')
    expect(btnContent).toContain("localStorage.getItem('gm_wishlist')")
    expect(btnContent).toContain("localStorage.setItem('gm_wishlist'")
    expect(btnContent).toContain("window.dispatchEvent(new CustomEvent('wishlist-updated'")

    // Verify favorite page exists and parses wishlist state
    expect(existsSync(WISHLIST_PAGE_PATH)).toBe(true)
    const wishlistPageContent = readFileSync(WISHLIST_PAGE_PATH, 'utf8')
    expect(wishlistPageContent).toContain("localStorage.getItem('gm_wishlist')")
    expect(wishlistPageContent).toContain("fetch(`/api/products")
  })

  test('3. Hodnotenia a recenzie produktov', () => {
    // Verify reviews are included in product details
    expect(existsSync(PRODUCT_DETAIL_PAGE_PATH)).toBe(true)
    const detailContent = readFileSync(PRODUCT_DETAIL_PAGE_PATH, 'utf8')
    expect(detailContent).toContain('ProductReviews')
    expect(detailContent).toContain('<ProductReviews')

    // Verify reviews component logic and reviews storage
    expect(existsSync(REVIEWS_PATH)).toBe(true)
    const reviewsContent = readFileSync(REVIEWS_PATH, 'utf8')
    expect(reviewsContent).toContain("gm_reviews_")
    expect(reviewsContent).toContain("stats.average")
    expect(reviewsContent).toContain("stats.distribution")
    expect(reviewsContent).toContain("handleSubmit")
  })

  test('4. Zákaznícka zóna a Vernostný program', () => {
    // Verify login page structure
    expect(existsSync(LOGIN_PAGE_PATH)).toBe(true)
    const loginContent = readFileSync(LOGIN_PAGE_PATH, 'utf8')
    expect(loginContent).toContain('Prihlásenie')
    expect(loginContent).toContain("localStorage.setItem('gm_user_session'")

    // Verify profile page structure and rewards redemption
    expect(existsSync(PROFILE_PAGE_PATH)).toBe(true)
    const profileContent = readFileSync(PROFILE_PAGE_PATH, 'utf8')
    expect(profileContent).toContain("localStorage.getItem('gm_user_session')")
    expect(profileContent).toContain("handleRedeem")
    expect(profileContent).toContain("handleApplyCouponToCart")
    expect(profileContent).toContain("ZLAVA10")
    expect(profileContent).toContain("DOPRAVAFREE")
  })
})
